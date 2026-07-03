#!/usr/bin/env python3
"""Small Comfy Cloud API client for the separate Telegram bot."""
from __future__ import annotations

import json
import mimetypes
import time
import uuid
from pathlib import Path
from urllib.parse import urlencode

import aiohttp


class ComfyCloudError(RuntimeError):
    pass


class ComfyCloudClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://cloud.comfy.org",
        email: str = "",
        password: str = "",
        firebase_api_key: str = "",
    ):
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.email = email.strip()
        self.password = password
        self.firebase_api_key = firebase_api_key.strip()
        self._auth_token = ""
        self._auth_expires_at = 0.0

    @property
    def headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json",
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    async def _ensure_auth_token(self) -> str:
        if self._auth_token and time.time() < self._auth_expires_at - 60:
            return self._auth_token
        if not (self.email and self.password and self.firebase_api_key):
            raise ComfyCloudError(
                "Partner API nodes need COMFY_EMAIL, COMFY_PASSWORD, and COMFY_FIREBASE_API_KEY."
            )

        signin_url = (
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            f"?key={self.firebase_api_key}"
        )
        async with aiohttp.ClientSession() as session:
            async with session.post(
                signin_url,
                json={
                    "email": self.email,
                    "password": self.password,
                    "returnSecureToken": True,
                },
            ) as resp:
                data = await resp.json(content_type=None)
                if resp.status >= 400:
                    message = data.get("error", {}).get("message") or f"Firebase HTTP {resp.status}"
                    raise ComfyCloudError(f"Comfy login failed: {message}")

            token = data.get("idToken")
            expires_in = int(data.get("expiresIn") or 3600)
            if not token:
                raise ComfyCloudError("Comfy login failed: missing idToken.")

            session_headers = dict(self.headers)
            session_headers.update({
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Origin": self.base_url,
                "Referer": f"{self.base_url}/",
            })
            async with session.post(
                f"{self.base_url}/api/auth/session",
                headers=session_headers,
                json={},
            ) as resp:
                session_data = await resp.json(content_type=None)
                if resp.status >= 400 or not session_data.get("success"):
                    message = session_data.get("message") or f"HTTP {resp.status}"
                    raise ComfyCloudError(f"Comfy session failed: {message}")

        self._auth_token = token
        self._auth_expires_at = time.time() + expires_in
        return token

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        headers = dict(self.headers)
        headers.update(kwargs.pop("headers", {}) or {})
        if kwargs.pop("json_body", False):
            headers["Content-Type"] = "application/json"
        async with aiohttp.ClientSession() as session:
            async with session.request(method, f"{self.base_url}{path}", headers=headers, **kwargs) as resp:
                text = await resp.text()
                try:
                    data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    data = {"message": text}
                if resp.status >= 400:
                    message = (
                        data.get("error")
                        or data.get("message")
                        or data.get("detail")
                        or f"HTTP {resp.status}"
                    )
                    raise ComfyCloudError(str(message))
                return data

    async def queue_info(self) -> dict:
        return await self._request("GET", "/api/prompt")

    async def submit_workflow(self, workflow: dict, needs_auth: bool = False) -> str:
        body = {"prompt": workflow}
        headers: dict[str, str] | None = None
        if needs_auth:
            token = await self._ensure_auth_token()
            body = {
                "client_id": str(uuid.uuid4()),
                "prompt": workflow,
                "extra_data": {
                    "auth_token_comfy_org": token,
                    "extra_pnginfo": {"workflow": {"nodes": []}},
                },
            }
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Origin": self.base_url,
                "Referer": f"{self.base_url}/",
            }
        data = await self._request(
            "POST",
            "/api/prompt",
            json=body,
            headers=headers,
            json_body=True,
        )
        prompt_id = data.get("prompt_id")
        if not prompt_id:
            raise ComfyCloudError(f"Missing prompt_id in response: {data}")
        return str(prompt_id)

    async def job_status(self, job_id: str) -> dict:
        return await self._request("GET", f"/api/job/{job_id}/status")

    async def job_details(self, job_id: str) -> dict:
        return await self._request("GET", f"/api/jobs/{job_id}")

    def file_url(self, item: dict) -> str:
        query = {
            "filename": item.get("filename", ""),
            "type": item.get("type", "output"),
            "subfolder": item.get("subfolder", ""),
        }
        query = {key: value for key, value in query.items() if value}
        return f"{self.base_url}/api/view?{urlencode(query)}"

    async def download_file(self, url: str, destination: Path) -> Path:
        destination.parent.mkdir(parents=True, exist_ok=True)
        data = await self.fetch_bytes(url)
        destination.write_bytes(data)
        return destination

    async def fetch_bytes(self, url: str) -> bytes:
        """Download a file's bytes into memory (serverless-safe - no local disk needed)."""
        headers = self.headers if url.startswith(self.base_url) else {}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status >= 400:
                    raise ComfyCloudError(f"Download failed: HTTP {resp.status}")
                return await resp.read()

    async def upload_input_file(self, path: Path) -> dict:
        """Upload a local media file to Comfy's input folder."""
        if not path.exists():
            raise ComfyCloudError(f"Upload file does not exist: {path}")
        return await self.upload_input_bytes(path.read_bytes(), path.name)

    async def upload_input_bytes(self, data: bytes, filename: str) -> dict:
        """Upload in-memory bytes to Comfy's input folder (no local disk needed)."""
        token = await self._ensure_auth_token()
        headers = dict(self.headers)
        headers.update(
            {
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
                "Origin": self.base_url,
                "Referer": f"{self.base_url}/",
            }
        )
        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        form = aiohttp.FormData()
        form.add_field("file", data, filename=filename, content_type=mime_type)
        form.add_field("overwrite", "true")
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/upload/image", headers=headers, data=form) as resp:
                text = await resp.text()
                try:
                    resp_data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    resp_data = {"message": text}
                if resp.status >= 400:
                    message = resp_data.get("error") or resp_data.get("message") or f"HTTP {resp.status}"
                    raise ComfyCloudError(f"Upload failed: {message}")
                if not resp_data.get("name"):
                    raise ComfyCloudError(f"Upload failed: missing name in response {resp_data}")
                return resp_data


def collect_output_files(job_details: dict) -> list[dict]:
    """Extract image/video file records from Comfy job outputs."""
    found: list[dict] = []
    seen: set[tuple[str, str, str]] = set()

    def walk(value):
        if isinstance(value, dict):
            if value.get("filename"):
                key = (
                    str(value.get("filename") or ""),
                    str(value.get("subfolder") or ""),
                    str(value.get("type") or "output"),
                )
                if key not in seen:
                    seen.add(key)
                    found.append(value)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(job_details.get("preview_output") or {})
    walk(job_details.get("outputs") or {})
    return found

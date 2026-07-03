"""ArtCraft/Storyteller client used by the website backend.

Credentials stay on the server. The React app only talks to this backend.
"""
from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import aiohttp


API_BASE = "https://api.storyteller.ai/v1"

ASPECT_MAPPING = {
    "9:16": "tall_nine_by_sixteen",
    "16:9": "wide_sixteen_by_nine",
    "1:1": "square",
    "4:3": "wide_four_by_three",
    "3:4": "tall_three_by_four",
    "3:2": "wide_three_by_two",
    "2:3": "tall_two_by_three",
    "4:5": "tall_four_by_five",
    "5:4": "wide_five_by_four",
    "21:9": "wide_sixteen_by_nine",
}

RESOLUTION_MAPPING = {
    "480p": "four_eighty_p",
    "720p": "seven_twenty_p",
    "1080p": "ten_eighty_p",
    "1K": "one_k",
    "2K": "two_k",
    "3K": "three_k",
    "4K": "four_k",
    "Auto": "",
}


@dataclass(frozen=True)
class ArtCraftAccount:
    email: str
    password: str


class ArtCraftError(RuntimeError):
    pass


class ArtCraftClient:
    def __init__(self, account: ArtCraftAccount):
        self.account = account
        self.session_token = ""

    async def login(self) -> None:
        headers = {
            "Origin": "https://app.getartcraft.com",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE}/login",
                json={"username_or_email": self.account.email, "password": self.account.password},
                headers=headers,
                timeout=30,
            ) as resp:
                data = await resp.json(content_type=None)
        token = ""
        if isinstance(data, dict):
            token = data.get("signed_session") or data.get("session_token") or data.get("session") or ""
            nested = data.get("data") if isinstance(data.get("data"), dict) else {}
            token = token or nested.get("signed_session") or nested.get("session_token") or nested.get("session") or ""
        if not token:
            raise ArtCraftError("ArtCraft login failed.")
        self.session_token = token

    async def _api(self, method: str, path: str, body: Optional[dict] = None, timeout: int = 60) -> dict:
        if not self.session_token:
            await self.login()
        headers = {
            "Origin": "https://app.getartcraft.com",
            "Accept": "application/json",
            "session": self.session_token,
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method,
                f"{API_BASE}{path}",
                json=body,
                headers=headers,
                timeout=timeout,
            ) as resp:
                text = await resp.text()
                try:
                    data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    data = {"message": text}
                if resp.status == 401:
                    self.session_token = ""
                return {"status": resp.status, "data": data}

    async def credits(self) -> int:
        result = await self._api("GET", "/credits/namespace/artcraft")
        data = result.get("data")
        if result["status"] >= 400 or not isinstance(data, dict):
            return 0
        return int(data.get("sum_total_credits") or 0)

    async def upload_media_token(self, path: Path, media_kind: str = "image") -> str:
        mime = "image/png"
        suffix = path.suffix.lower()
        if suffix in {".jpg", ".jpeg"}:
            mime = "image/jpeg"
        elif suffix == ".webp":
            mime = "image/webp"
        elif media_kind == "video":
            mime = "video/mp4"

        form = aiohttp.FormData()
        form.add_field("uuid_idempotency_token", str(uuid.uuid4()))
        endpoint = "/media_files/upload/image"
        if media_kind == "video":
            endpoint = "/media_files/upload/new_engine_asset"
            form.add_field("engine_category", "video")
        else:
            form.add_field("is_intermediate_system_file", "true")
        form.add_field("file", path.read_bytes(), filename=path.name, content_type=mime)
        headers = {
            "Origin": "https://app.getartcraft.com",
            "session": self.session_token,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{API_BASE}{endpoint}", data=form, headers=headers, timeout=120) as resp:
                text = await resp.text()
                try:
                    data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    data = {"message": text}
                if resp.status >= 400:
                    raise ArtCraftError(f"ArtCraft media upload failed: HTTP {resp.status}")
        token = (
            data.get("media_file_token")
            or data.get("media_token")
            or data.get("token")
            or (data.get("data") or {}).get("media_file_token")
            or (data.get("data") or {}).get("media_token")
        )
        if not token:
            raise ArtCraftError("ArtCraft media upload failed: no media token returned.")
        return str(token)

    async def generate_video(
        self,
        *,
        prompt: str,
        model: str,
        aspect_ratio: str,
        duration: str,
        resolution: str,
        ref_image: Optional[Path] = None,
        end_image: Optional[Path] = None,
    ) -> str:
        payload = {
            "prompt": prompt,
            "model": model,
            "aspect_ratio": ASPECT_MAPPING.get(aspect_ratio, aspect_ratio or "wide_sixteen_by_nine"),
            "duration_seconds": int(float(str(duration or "5").replace("s", ""))),
            "video_batch_count": 1,
            "idempotency_token": str(uuid.uuid4()),
        }
        mapped_resolution = RESOLUTION_MAPPING.get(resolution or "")
        if mapped_resolution:
            payload["resolution"] = mapped_resolution
        if ref_image:
            payload["reference_image_media_tokens"] = [await self.upload_media_token(ref_image)]
        if end_image:
            payload["end_frame_image_media_token"] = await self.upload_media_token(end_image)

        result = await self._api("POST", "/omni_gen/generate/video", payload)
        data = result.get("data") if isinstance(result.get("data"), dict) else {}
        token = data.get("inference_job_token")
        if result["status"] == 402:
            raise ArtCraftError("Generation account needs more ArtCraft credits.")
        if result["status"] >= 400 or not token:
            message = data.get("message") or data.get("BadInput") or data.get("error_message") or "request failed"
            raise ArtCraftError(f"ArtCraft video request failed: {message}")
        return str(token)

    async def generate_image(
        self,
        *,
        prompt: str,
        model: str,
        aspect_ratio: str,
        resolution: str,
        ref_image: Optional[Path] = None,
    ) -> str:
        payload = {
            "prompt": prompt,
            "model": model,
            "aspect_ratio": ASPECT_MAPPING.get(aspect_ratio, aspect_ratio or "square"),
            "image_batch_count": 1,
            "idempotency_token": str(uuid.uuid4()),
        }
        mapped_resolution = RESOLUTION_MAPPING.get(resolution or "")
        if mapped_resolution:
            payload["resolution"] = mapped_resolution
        if ref_image:
            payload["image_media_tokens"] = [await self.upload_media_token(ref_image)]

        result = await self._api("POST", "/omni_gen/generate/image", payload)
        data = result.get("data") if isinstance(result.get("data"), dict) else {}
        token = data.get("inference_job_token")
        if result["status"] == 402:
            raise ArtCraftError("Generation account needs more ArtCraft credits.")
        if result["status"] >= 400 or not token:
            message = data.get("message") or data.get("BadInput") or data.get("error_message") or "request failed"
            raise ArtCraftError(f"ArtCraft image request failed: {message}")
        return str(token)

    async def poll_job(self, job_id: str, timeout: int) -> str:
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = await self._api("GET", f"/jobs/job/{job_id}", timeout=30)
            data = result.get("data") or {}
            job = data.get("job") if isinstance(data, dict) else None
            if not isinstance(job, dict) and isinstance(data, dict) and data.get("job_token"):
                job = data
            if isinstance(job, dict):
                status = (job.get("status") or {}).get("status", "")
                if status == "complete_success":
                    media = ((job.get("maybe_result") or {}).get("media_links") or {})
                    url = media.get("cdn_url") or media.get("url")
                    if url:
                        return str(url)
                    raise ArtCraftError("ArtCraft job completed without a media URL.")
                if status in {"complete_failure", "failed", "error", "dead"}:
                    detail = (job.get("status") or {}).get("maybe_failure_message") or status
                    raise ArtCraftError(f"ArtCraft job failed: {detail}")
            await asyncio.sleep(4)
        raise ArtCraftError(f"ArtCraft job did not finish within {timeout}s.")


class ArtCraftPool:
    def __init__(self, accounts_file: Optional[str] = None):
        default_path = Path(__file__).resolve().parents[2] / "artcraft_accounts.txt"
        self.accounts_file = Path(accounts_file or os.environ.get("ARTCRAFT_ACCOUNTS_FILE") or default_path)
        self.accounts = self._load_accounts()
        self._clients: dict[str, ArtCraftClient] = {}
        self._busy: set[str] = set()
        self._blocked: dict[str, float] = {}
        self._idx = 0
        self._cond = asyncio.Condition()

    def _load_accounts(self) -> list[ArtCraftAccount]:
        if not self.accounts_file.exists():
            return []
        accounts: list[ArtCraftAccount] = []
        for raw in self.accounts_file.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or ":" not in line:
                continue
            email, password = line.split(":", 1)
            accounts.append(ArtCraftAccount(email.strip(), password.strip()))
        return accounts

    def summary(self) -> dict:
        return {
            "total": len(self.accounts),
            "busy": len(self._busy),
            "blocked": len(self._blocked),
            "free": max(0, len(self.accounts) - len(self._busy) - len(self._blocked)),
        }

    async def borrow(self) -> ArtCraftClient:
        async with self._cond:
            if not self.accounts:
                raise ArtCraftError("No ArtCraft accounts configured.")
            now = time.time()
            retry_after = int(os.environ.get("ARTCRAFT_ACCOUNT_RECHECK_SECONDS", "600"))
            self._blocked = {k: v for k, v in self._blocked.items() if now - v < retry_after}
            for _ in range(len(self.accounts)):
                account = self.accounts[self._idx]
                self._idx = (self._idx + 1) % len(self.accounts)
                key = account.email.lower()
                if key in self._busy or key in self._blocked:
                    continue
                self._busy.add(key)
                client = self._clients.get(key)
                if not client:
                    client = ArtCraftClient(account)
                    self._clients[key] = client
                return client
            raise ArtCraftError("No free ArtCraft generation account is available.")

    async def release(self, client: ArtCraftClient) -> None:
        async with self._cond:
            self._busy.discard(client.account.email.lower())
            self._cond.notify_all()

    async def block(self, client: ArtCraftClient) -> None:
        async with self._cond:
            key = client.account.email.lower()
            self._busy.discard(key)
            self._blocked[key] = time.time()
            self._clients.pop(key, None)
            self._cond.notify_all()

"""ArtCraft (storyteller.ai) client for a single, legitimately-paid account.

This is intentionally NOT a multi-account pool. One real ArtCraft login is
configured via ARTCRAFT_EMAIL / ARTCRAFT_PASSWORD and used directly - the
same pattern as the Comfy Cloud client. Credentials stay server-side only.
"""
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
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

# Maps our existing catalog model ids -> ArtCraft's internal model slugs.
# Used only as a fallback when the primary Comfy Cloud generation fails.
ARTCRAFT_VIDEO_MODELS = {
    "sora-2": "sora_2",
    "sora-2-pro": "sora_2_pro",
    "veo-3.1-fast": "veo_3p1_fast",
    "veo-2": "veo_2",
    "kling-omni": "kling_3p0_pro",
    "seedance-pro": "seedance_2p0",
    "seedance-fast": "seedance_2p0_bp",
    "grok-video": "grok_imagine_video",
    "happyhorse": "happy_horse_1p0",
}
ARTCRAFT_IMAGE_MODELS = {
    "nano-banana": "nano_banana",
    "nano-banana-2": "nano_banana_2",
    "nano-banana-pro": "nano_banana_pro",
    "gpt-image-2": "gpt_image_2",
    "grok-image": "grok_image",
    "flux-1.1-ultra": "flux_pro_1p1_ultra",
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
                method, f"{API_BASE}{path}", json=body, headers=headers, timeout=timeout,
            ) as resp:
                text = await resp.text()
                try:
                    data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    data = {"message": text}
                if resp.status == 401:
                    # Session expired - retry once with a fresh login.
                    self.session_token = ""
                return {"status": resp.status, "data": data}

    async def _api_retry(self, method: str, path: str, body: Optional[dict] = None, timeout: int = 60) -> dict:
        result = await self._api(method, path, body, timeout)
        if result["status"] == 401:
            await self.login()
            result = await self._api(method, path, body, timeout)
        return result

    async def credits(self) -> int:
        result = await self._api_retry("GET", "/credits/namespace/artcraft")
        data = result.get("data")
        if result["status"] >= 400 or not isinstance(data, dict):
            return 0
        return int(data.get("sum_total_credits") or 0)

    async def upload_media_bytes(self, data: bytes, filename: str, media_kind: str = "image") -> str:
        mime = "image/png"
        lower = filename.lower()
        if lower.endswith((".jpg", ".jpeg")):
            mime = "image/jpeg"
        elif lower.endswith(".webp"):
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
        form.add_field("file", data, filename=filename, content_type=mime)

        if not self.session_token:
            await self.login()
        headers = {"Origin": "https://app.getartcraft.com", "session": self.session_token}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{API_BASE}{endpoint}", data=form, headers=headers, timeout=120) as resp:
                text = await resp.text()
                try:
                    resp_data = json.loads(text) if text else {}
                except json.JSONDecodeError:
                    resp_data = {"message": text}
                if resp.status >= 400:
                    raise ArtCraftError(f"ArtCraft media upload failed: HTTP {resp.status}")
        token = (
            resp_data.get("media_file_token") or resp_data.get("media_token") or resp_data.get("token")
            or (resp_data.get("data") or {}).get("media_file_token")
            or (resp_data.get("data") or {}).get("media_token")
        )
        if not token:
            raise ArtCraftError("ArtCraft media upload failed: no media token returned.")
        return str(token)

    async def generate_video(self, *, prompt: str, model: str, aspect_ratio: str, duration: str,
                              resolution: str, ref_media_token: Optional[str] = None) -> str:
        payload = {
            "prompt": prompt, "model": model,
            "aspect_ratio": ASPECT_MAPPING.get(aspect_ratio, aspect_ratio or "wide_sixteen_by_nine"),
            "duration_seconds": int(float(str(duration or "5").replace("s", ""))),
            "video_batch_count": 1, "idempotency_token": str(uuid.uuid4()),
        }
        mapped_resolution = RESOLUTION_MAPPING.get(resolution or "")
        if mapped_resolution:
            payload["resolution"] = mapped_resolution
        if ref_media_token:
            payload["reference_image_media_tokens"] = [ref_media_token]

        result = await self._api_retry("POST", "/omni_gen/generate/video", payload)
        data = result.get("data") if isinstance(result.get("data"), dict) else {}
        token = data.get("inference_job_token")
        if result["status"] == 402:
            raise ArtCraftError("ArtCraft account needs more credits.")
        if result["status"] >= 400 or not token:
            message = data.get("message") or data.get("BadInput") or data.get("error_message") or "request failed"
            raise ArtCraftError(f"ArtCraft video request failed: {message}")
        return str(token)

    async def generate_image(self, *, prompt: str, model: str, aspect_ratio: str,
                              resolution: str, ref_media_token: Optional[str] = None) -> str:
        payload = {
            "prompt": prompt, "model": model,
            "aspect_ratio": ASPECT_MAPPING.get(aspect_ratio, aspect_ratio or "square"),
            "image_batch_count": 1, "idempotency_token": str(uuid.uuid4()),
        }
        mapped_resolution = RESOLUTION_MAPPING.get(resolution or "")
        if mapped_resolution:
            payload["resolution"] = mapped_resolution
        if ref_media_token:
            payload["image_media_tokens"] = [ref_media_token]

        result = await self._api_retry("POST", "/omni_gen/generate/image", payload)
        data = result.get("data") if isinstance(result.get("data"), dict) else {}
        token = data.get("inference_job_token")
        if result["status"] == 402:
            raise ArtCraftError("ArtCraft account needs more credits.")
        if result["status"] >= 400 or not token:
            message = data.get("message") or data.get("BadInput") or data.get("error_message") or "request failed"
            raise ArtCraftError(f"ArtCraft image request failed: {message}")
        return str(token)

    async def poll_job(self, job_id: str, timeout: int) -> str:
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = await self._api_retry("GET", f"/jobs/job/{job_id}", timeout=30)
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
            import asyncio
            await asyncio.sleep(4)
        raise ArtCraftError(f"ArtCraft job did not finish within {timeout}s.")

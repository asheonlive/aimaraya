"""Client for the VPS-hosted Artlist relay service.

Artlist.io generation requires driving a real browser (Playwright), which
cannot run inside this Vercel serverless function. Instead, a small relay
service (`artlist_relay.py`) runs on the same VPS as the Telegram bot, which
already has Playwright/Chromium installed. This module just makes an
authenticated HTTP call to that relay - the last-resort fallback tier,
after Comfy Cloud and ArtCraft have both failed.
"""
import aiohttp


class ArtlistRelayError(RuntimeError):
    pass


async def generate_video_via_relay(
    relay_url: str,
    relay_secret: str,
    *,
    prompt: str,
    model_name: str = "",
    duration: str = "",
    aspect_ratio: str = "",
    resolution: str = "",
    timeout: int = 260,
) -> bytes:
    if not relay_url or not relay_secret:
        raise ArtlistRelayError(
            "Artlist relay isn't configured (missing ARTLIST_RELAY_URL/ARTLIST_RELAY_SECRET)."
        )
    url = relay_url.rstrip("/") + "/generate/video"
    payload = {
        "prompt": prompt,
        "model_name": model_name,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
    }
    headers = {"X-Relay-Secret": relay_secret}
    client_timeout = aiohttp.ClientTimeout(total=timeout)
    async with aiohttp.ClientSession(timeout=client_timeout) as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status >= 400:
                text = await resp.text()
                raise ArtlistRelayError(f"Artlist relay failed: HTTP {resp.status} - {text[:300]}")
            return await resp.read()

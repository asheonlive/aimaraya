"""AI MARAYA — Artlist.io relay service (runs on the VPS).

Artlist.io generation requires driving a real browser (Playwright/Chromium),
which cannot run inside the Vercel serverless backend. This tiny FastAPI
service runs on the same VPS as the Telegram bot (which already has Chromium
installed) and exposes an authenticated endpoint the website's backend calls
as its last-resort video-generation tier.

Endpoints
---------
GET  /health           -> {"status":"ok","configured":<bool>}   (no auth)
POST /generate/video   -> returns raw video bytes (video/mp4)    (X-Relay-Secret)

Auth
----
Every /generate call must send `X-Relay-Secret: <RELAY_SECRET>` matching the
env var. The website backend holds the same secret (ARTLIST_RELAY_SECRET on
Vercel). The real Artlist credentials (ARTLIST_EMAIL / ARTLIST_PASSWORD) live
ONLY here on the VPS and never touch Vercel.

Config (env vars)
-----------------
  RELAY_SECRET        shared secret the caller must present (required)
  ARTLIST_EMAIL       Artlist.io account email (required)
  ARTLIST_PASSWORD    Artlist.io account password (required)
  RELAY_PORT          port to bind (default 8800)
  RELAY_HEADLESS      "0" to watch the browser while debugging (default "1")
  ARTLIST_GEN_URL     page where AI video generation lives
                      (default https://app.artlist.io/ai/video)
  ARTLIST_DEBUG       "1" to include step logs + a base64 screenshot in error
                      responses (helps tune selectors against the live DOM)

The generation-page selectors are best-effort guesses (Artlist ships a SPA
that changes). They are overridable via env vars so you can tune without
editing code:
  SEL_PROMPT          prompt textarea/input
  SEL_GENERATE        the "Generate" button
  SEL_RESULT_VIDEO    the resulting <video> element
Each accepts a comma-separated list of CSS/text selectors, tried in order.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import Response
from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PWTimeout,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("artlist_relay")

LOGIN_URL = "https://artlist.io/login"


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _sel_list(env_name: str, defaults: list[str]) -> list[str]:
    raw = _env(env_name)
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    return defaults


RELAY_SECRET = _env("RELAY_SECRET")
ARTLIST_EMAIL = _env("ARTLIST_EMAIL")
ARTLIST_PASSWORD = _env("ARTLIST_PASSWORD")
HEADLESS = _env("RELAY_HEADLESS", "1") != "0"
GEN_URL = _env("ARTLIST_GEN_URL", "https://app.artlist.io/ai/video")
DEBUG = _env("ARTLIST_DEBUG", "0") == "1"

PROMPT_SELECTORS = _sel_list(
    "SEL_PROMPT",
    [
        "textarea[placeholder*='describe' i]",
        "textarea[placeholder*='prompt' i]",
        "textarea[name='prompt']",
        "textarea[data-testid*='prompt' i]",
        "div[contenteditable='true']",
        "textarea",
        "input[type='text'][placeholder*='prompt' i]",
    ],
)
GENERATE_SELECTORS = _sel_list(
    "SEL_GENERATE",
    [
        "button:has-text('Generate')",
        "button:has-text('Create')",
        "button:has-text('Generate video')",
        "button[data-testid*='generate' i]",
        "button[type='submit']",
    ],
)
RESULT_VIDEO_SELECTORS = _sel_list(
    "SEL_RESULT_VIDEO",
    [
        "video[src]",
        "video source[src]",
        "[data-testid*='result' i] video",
    ],
)

app = FastAPI(title="AI MARAYA Artlist Relay", version="1.0.0")


def _configured() -> bool:
    return bool(RELAY_SECRET and ARTLIST_EMAIL and ARTLIST_PASSWORD)


@app.get("/")
@app.get("/health")
async def health():
    """Unauthenticated liveness + config check.

    `configured` is True only when the relay secret AND the Artlist
    credentials are all present, i.e. the service can actually serve
    generation requests.
    """
    return {"status": "ok", "configured": _configured()}


# ---------- Playwright helpers (login logic mirrors backend/artlist_client.py) ----------

async def _try_click_consent(page: Page, logs: list[str]) -> None:
    for sel in (
        "button:has-text('Accept all')",
        "button:has-text('Accept All')",
        "button:has-text('Accept')",
        "button:has-text('I agree')",
        "button:has-text('Got it')",
        "button[aria-label*='accept' i]",
        "#onetrust-accept-btn-handler",
    ):
        try:
            btn = page.locator(sel).first
            if await btn.is_visible(timeout=800):
                await btn.click(timeout=1500)
                logs.append(f"consent: clicked '{sel}'")
                await page.wait_for_timeout(300)
                return
        except Exception:
            continue


async def _fill_first_visible(page: Page, selectors: list[str], value: str, label: str, logs: list[str]) -> bool:
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if await loc.count() == 0:
                continue
            try:
                await loc.wait_for(state="visible", timeout=1500)
            except PWTimeout:
                continue
            await loc.fill(value)
            logs.append(f"{label}: filled via {sel}")
            return True
        except Exception as e:
            logs.append(f"{label}: {sel} failed ({e.__class__.__name__})")
            continue
    return False


async def _click_first_visible(page: Page, selectors: list[str], label: str, logs: list[str]) -> bool:
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if await loc.count() == 0:
                continue
            try:
                await loc.wait_for(state="visible", timeout=1500)
            except PWTimeout:
                continue
            await loc.click()
            logs.append(f"{label}: clicked {sel}")
            return True
        except Exception as e:
            logs.append(f"{label}: {sel} failed ({e.__class__.__name__})")
            continue
    return False


async def _login(page: Page, context: BrowserContext, logs: list[str]) -> None:
    logs.append(f"goto {LOGIN_URL}")
    try:
        await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=25000)
    except PWTimeout:
        logs.append("initial goto timeout — continuing")
    await page.wait_for_timeout(1500)
    await _try_click_consent(page, logs)

    email_selectors = [
        "input[type='email']",
        "input[name='email']",
        "input[id='email']",
        "input[autocomplete='email']",
        "input[placeholder*='email' i]",
    ]
    pw_selectors = [
        "input[type='password']",
        "input[name='password']",
        "input[id='password']",
        "input[autocomplete*='password' i]",
    ]
    submit_selectors = [
        "button[type='submit']",
        "button:has-text('Log in')",
        "button:has-text('Sign in')",
        "button:has-text('Continue')",
        "button:has-text('Login')",
    ]

    if not await _fill_first_visible(page, email_selectors, ARTLIST_EMAIL, "email", logs):
        raise RuntimeError("Could not find the email input on the login page.")

    await page.wait_for_timeout(400)
    filled_pw = await _fill_first_visible(page, pw_selectors, ARTLIST_PASSWORD, "password", logs)
    if not filled_pw:
        logs.append("password field not found — trying 2-step flow")
        await _click_first_visible(page, submit_selectors, "step1-submit", logs)
        await page.wait_for_timeout(2000)
        filled_pw = await _fill_first_visible(page, pw_selectors, ARTLIST_PASSWORD, "password (step2)", logs)
        if not filled_pw:
            raise RuntimeError("Could not find the password input on the login page.")

    await page.wait_for_timeout(300)
    if not await _click_first_visible(page, submit_selectors, "final-submit", logs):
        logs.append("submit button not found — pressing Enter")
        try:
            await page.keyboard.press("Enter")
        except Exception:
            pass

    try:
        await page.wait_for_load_state("networkidle", timeout=15000)
    except PWTimeout:
        logs.append("networkidle timeout — continuing")
    await page.wait_for_timeout(2500)

    cookies = await context.cookies()
    still_on_login = "/login" in page.url.lower()
    cookie_names = {c.get("name", "").lower() for c in cookies}
    has_auth_cookie = any(
        any(k in n for k in ("session", "auth", "token", "sid", "sso"))
        for n in cookie_names
    )
    logs.append(f"post-login url={page.url} cookies={len(cookies)}")
    if still_on_login and not has_auth_cookie:
        raise RuntimeError(f"Login appears to have failed (still on {page.url}).")


async def _download_video(page: Page, context: BrowserContext, src: str, logs: list[str]) -> bytes:
    """Fetch the result video bytes.

    Blob URLs can't be fetched over HTTP, so we pull them from the page via
    an in-page fetch(); http(s) URLs are fetched through the authenticated
    browser context so cookies/referer carry over.
    """
    if src.startswith("blob:"):
        logs.append("result is a blob: url — reading via in-page fetch")
        data_url = await page.evaluate(
            """async (u) => {
                const r = await fetch(u);
                const b = await r.blob();
                return await new Promise((res) => {
                    const fr = new FileReader();
                    fr.onload = () => res(fr.result);
                    fr.readAsDataURL(b);
                });
            }""",
            src,
        )
        return base64.b64decode(data_url.split(",", 1)[1])

    logs.append(f"fetching result video {src[:80]}")
    resp = await context.request.get(src)
    if resp.status >= 400:
        raise RuntimeError(f"Downloading result video failed: HTTP {resp.status}")
    return await resp.body()


async def _generate(
    prompt: str,
    model_name: str,
    duration: str,
    aspect_ratio: str,
    resolution: str,
    logs: list[str],
) -> tuple[bytes, Optional[str]]:
    """Drive Artlist.io to produce a video for `prompt`; return (bytes, screenshot_b64)."""
    screenshot_b64: Optional[str] = None
    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(
            headless=HEADLESS,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ],
        )
        try:
            context = await browser.new_context(
                viewport={"width": 1366, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                ),
                locale="en-US",
                accept_downloads=True,
            )
            page = await context.new_page()

            await _login(page, context, logs)

            logs.append(f"goto generation page {GEN_URL}")
            try:
                await page.goto(GEN_URL, wait_until="domcontentloaded", timeout=30000)
            except PWTimeout:
                logs.append("generation page goto timeout — continuing")
            await page.wait_for_timeout(2500)
            await _try_click_consent(page, logs)

            if not await _fill_first_visible(page, PROMPT_SELECTORS, prompt, "prompt", logs):
                raise RuntimeError(
                    "Could not find the prompt field on the generation page. "
                    "Set SEL_PROMPT to the correct selector (enable ARTLIST_DEBUG=1 "
                    "to get a screenshot)."
                )

            await page.wait_for_timeout(500)
            if not await _click_first_visible(page, GENERATE_SELECTORS, "generate", logs):
                raise RuntimeError(
                    "Could not find/click the Generate button. Set SEL_GENERATE."
                )

            # Artlist renders server-side; generation can take a while. Poll for
            # a <video> with a real src to appear.
            gen_timeout_s = int(_env("ARTLIST_GEN_TIMEOUT_S", "240"))
            logs.append(f"waiting up to {gen_timeout_s}s for result video")
            src: Optional[str] = None
            deadline = asyncio.get_event_loop().time() + gen_timeout_s
            while asyncio.get_event_loop().time() < deadline:
                for sel in RESULT_VIDEO_SELECTORS:
                    try:
                        loc = page.locator(sel).first
                        if await loc.count() > 0:
                            candidate = await loc.get_attribute("src")
                            if candidate:
                                src = candidate
                                break
                    except Exception:
                        continue
                if src:
                    break
                await page.wait_for_timeout(3000)

            if DEBUG:
                try:
                    png = await page.screenshot(full_page=False)
                    screenshot_b64 = base64.b64encode(png).decode()
                except Exception:
                    pass

            if not src:
                raise RuntimeError(
                    f"No result video appeared within {gen_timeout_s}s. "
                    "The generation may still be running or SEL_RESULT_VIDEO needs tuning."
                )

            data = await _download_video(page, context, src, logs)
            if not data:
                raise RuntimeError("Result video was empty.")
            logs.append(f"downloaded {len(data)} bytes")
            return data, screenshot_b64
        finally:
            try:
                await browser.close()
            except Exception:
                pass


@app.post("/generate/video")
async def generate_video(request: Request, x_relay_secret: Optional[str] = Header(None)):
    if not _configured():
        raise HTTPException(503, "Relay not configured (missing RELAY_SECRET / ARTLIST_EMAIL / ARTLIST_PASSWORD).")
    if not x_relay_secret or x_relay_secret != RELAY_SECRET:
        raise HTTPException(401, "Invalid or missing X-Relay-Secret.")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Body must be JSON.")
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(400, "Missing 'prompt'.")

    logs: list[str] = []
    try:
        data, shot = await _generate(
            prompt=prompt,
            model_name=body.get("model_name", ""),
            duration=body.get("duration", ""),
            aspect_ratio=body.get("aspect_ratio", ""),
            resolution=body.get("resolution", ""),
            logs=logs,
        )
    except Exception as e:
        logger.exception("generation failed")
        detail: dict = {"error": f"{e.__class__.__name__}: {e}"}
        if DEBUG:
            detail["logs"] = logs
        raise HTTPException(502, detail)

    return Response(content=data, media_type="video/mp4")


if __name__ == "__main__":
    import uvicorn

    port = int(_env("RELAY_PORT", "8800"))
    logger.info("Starting Artlist relay on 0.0.0.0:%s (configured=%s)", port, _configured())
    uvicorn.run(app, host="0.0.0.0", port=port)

"""Artlist.io Playwright client.

Headless-browser automation against https://artlist.io.
Currently only implements `test_login` — a minimal login probe used by
`POST /api/artlist/test-login` to verify our credentials are valid.

We store creds in ARTLIST_EMAIL / ARTLIST_PASSWORD env vars.

Design notes:
- We use `chromium` in headless mode inside the container.
- We keep a fresh browser context per call (no cookie reuse yet) so this
  test endpoint is safe to hit repeatedly.
- Selectors are guessed from the public Artlist login flow (email input,
  password input, submit button). If Artlist changes their DOM we surface
  a helpful error including the current URL + page title.
"""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, TimeoutError as PWTimeout

logger = logging.getLogger("artlist")

LOGIN_URL = "https://artlist.io/login"
# Post-login the user usually lands on the app subdomain / dashboard.
POST_LOGIN_HINTS = ("artlist.io/", "app.artlist.io", "/browse", "/library", "/dashboard")


class ArtlistError(RuntimeError):
    pass


@dataclass
class ArtlistLoginResult:
    ok: bool
    logged_in_url: str = ""
    page_title: str = ""
    cookies_count: int = 0
    error: str = ""
    screenshot_path: str = ""
    duration_ms: int = 0
    logs: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "logged_in_url": self.logged_in_url,
            "page_title": self.page_title,
            "cookies_count": self.cookies_count,
            "error": self.error,
            "screenshot_path": self.screenshot_path,
            "duration_ms": self.duration_ms,
            "logs": self.logs,
        }


async def _try_click_consent(page: Page, logs: list[str]) -> None:
    """Best-effort dismiss cookie / consent banners that block clicks."""
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


async def test_login(
    email: Optional[str] = None,
    password: Optional[str] = None,
    *,
    headless: bool = True,
    screenshot_path: Optional[str] = None,
    total_timeout_s: int = 45,
) -> ArtlistLoginResult:
    """Attempt to log into artlist.io and report the outcome.

    Returns an ArtlistLoginResult describing whether login succeeded,
    the final URL, the number of cookies collected, and a step-by-step
    log so you can debug DOM changes.
    """
    email = email or os.environ.get("ARTLIST_EMAIL", "")
    password = password or os.environ.get("ARTLIST_PASSWORD", "")
    if not email or not password:
        return ArtlistLoginResult(ok=False, error="ARTLIST_EMAIL/ARTLIST_PASSWORD not set")

    logs: list[str] = []
    started = asyncio.get_event_loop().time()

    async def _run() -> ArtlistLoginResult:
        async with async_playwright() as pw:
            browser: Browser = await pw.chromium.launch(
                headless=headless,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            try:
                context: BrowserContext = await browser.new_context(
                    viewport={"width": 1366, "height": 900},
                    user_agent=(
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                    ),
                    locale="en-US",
                )
                page = await context.new_page()
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
                    "input[data-testid*='email' i]",
                ]
                pw_selectors = [
                    "input[type='password']",
                    "input[name='password']",
                    "input[id='password']",
                    "input[autocomplete*='password' i]",
                    "input[placeholder*='password' i]",
                    "input[data-testid*='password' i]",
                ]
                submit_selectors = [
                    "button[type='submit']",
                    "button:has-text('Log in')",
                    "button:has-text('Log In')",
                    "button:has-text('Sign in')",
                    "button:has-text('Sign In')",
                    "button:has-text('Continue')",
                    "button:has-text('Login')",
                    "[data-testid*='login' i][role='button']",
                ]

                if not await _fill_first_visible(page, email_selectors, email, "email", logs):
                    raise ArtlistError("Could not find the email input on the login page.")

                # Some flows are 2-step (email → click continue → password).
                # We first try the "single form" flow: fill password immediately.
                await page.wait_for_timeout(400)
                filled_pw = await _fill_first_visible(page, pw_selectors, password, "password", logs)
                if not filled_pw:
                    # Try a 2-step flow: click "Continue" then fill password
                    logs.append("password field not found — trying 2-step flow")
                    await _click_first_visible(page, submit_selectors, "step1-submit", logs)
                    await page.wait_for_timeout(2000)
                    filled_pw = await _fill_first_visible(page, pw_selectors, password, "password (step2)", logs)
                    if not filled_pw:
                        raise ArtlistError("Could not find the password input on the login page.")

                await page.wait_for_timeout(300)
                if not await _click_first_visible(page, submit_selectors, "final-submit", logs):
                    # Fallback: press Enter in password field
                    logs.append("submit button not found — pressing Enter")
                    try:
                        await page.keyboard.press("Enter")
                    except Exception:
                        pass

                # Wait for navigation OR for an error banner
                try:
                    await page.wait_for_load_state("networkidle", timeout=15000)
                except PWTimeout:
                    logs.append("networkidle timeout — continuing")

                # Give SPA a moment to route after auth
                await page.wait_for_timeout(2500)

                url = page.url
                title = ""
                try:
                    title = await page.title()
                except Exception:
                    pass
                cookies = await context.cookies()
                logs.append(f"final url={url} title={title!r} cookies={len(cookies)}")

                # Look for common error / still-on-login indicators
                still_on_login = "/login" in url.lower()
                error_texts: list[str] = []
                for sel in (
                    "text=/incorrect|invalid|wrong|failed|try again/i",
                    "[role='alert']",
                    "div[class*='error' i]",
                ):
                    try:
                        loc = page.locator(sel).first
                        if await loc.count() > 0 and await loc.is_visible():
                            txt = (await loc.text_content()) or ""
                            if txt.strip():
                                error_texts.append(txt.strip()[:180])
                                break
                    except Exception:
                        continue

                # Success heuristics: (a) URL moved away from /login,
                # OR (b) an auth/session cookie is set.
                cookie_names = {c.get("name", "").lower() for c in cookies}
                has_auth_cookie = any(
                    any(k in n for k in ("session", "auth", "token", "sid", "sso", "id"))
                    for n in cookie_names
                )
                looks_logged_in = (not still_on_login) or has_auth_cookie

                screenshot_out = ""
                if screenshot_path:
                    try:
                        await page.screenshot(path=screenshot_path, full_page=False)
                        screenshot_out = screenshot_path
                    except Exception as e:
                        logs.append(f"screenshot failed: {e}")

                if looks_logged_in and not error_texts:
                    return ArtlistLoginResult(
                        ok=True,
                        logged_in_url=url,
                        page_title=title,
                        cookies_count=len(cookies),
                        screenshot_path=screenshot_out,
                        logs=logs,
                    )

                err = "; ".join(error_texts) or f"Still on login page ({url})"
                return ArtlistLoginResult(
                    ok=False,
                    logged_in_url=url,
                    page_title=title,
                    cookies_count=len(cookies),
                    error=err,
                    screenshot_path=screenshot_out,
                    logs=logs,
                )
            finally:
                try:
                    await browser.close()
                except Exception:
                    pass

    try:
        res = await asyncio.wait_for(_run(), timeout=total_timeout_s)
    except asyncio.TimeoutError:
        res = ArtlistLoginResult(
            ok=False,
            error=f"Login flow exceeded {total_timeout_s}s hard timeout",
            logs=logs,
        )
    except ArtlistError as e:
        res = ArtlistLoginResult(ok=False, error=str(e), logs=logs)
    except Exception as e:
        logger.exception("artlist login failed")
        res = ArtlistLoginResult(ok=False, error=f"{e.__class__.__name__}: {e}", logs=logs)

    res.duration_ms = int((asyncio.get_event_loop().time() - started) * 1000)
    return res

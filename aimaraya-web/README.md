# AI MARAYA — Artlist relay (VPS)

This small service is the **last-resort video tier** for the AI MARAYA website.
The site's generation fallback chain is:

```
Comfy Cloud  ->  ArtCraft  ->  Artlist.io (via this relay)
```

Artlist.io has no public API — generating a video means driving a real logged-in
browser. That can't run in the Vercel serverless backend, so it runs **here**, on
the same VPS as your Telegram bot (which already has Chromium). The website
backend calls this relay over HTTP with a shared secret.

Your real Artlist credentials live **only on this VPS** — they never go to Vercel.

## Files

| File | What it is |
|------|-----------|
| `artlist_relay.py` | The FastAPI relay service |
| `requirements.txt` | Python deps (FastAPI, uvicorn, Playwright) |
| `deploy.sh` | One-command setup: venv, Chromium, systemd service, health check |

## Deploy

1. Upload this folder to the VPS.
2. Run:

   ```bash
   bash deploy.sh
   ```

3. First run creates `.env` with a generated `RELAY_SECRET`. Edit it and set your
   Artlist login:

   ```bash
   nano .env      # set ARTLIST_EMAIL and ARTLIST_PASSWORD
   sudo systemctl restart artlist-relay
   ```

4. Confirm it's healthy:

   ```bash
   curl http://127.0.0.1:8800/health
   # -> {"status":"ok","configured":true}
   ```

   `configured:true` means the secret **and** both Artlist credentials are set.

5. Give Claude the two values `deploy.sh` prints:

   ```
   ARTLIST_RELAY_URL    = http://<YOUR_VPS_PUBLIC_IP>:8800
   ARTLIST_RELAY_SECRET = <the generated secret>
   ```

   Claude adds these to Vercel and redeploys the site.

## Make the port reachable

The website backend must reach `ARTLIST_RELAY_URL` over the public internet.
Open the port (example with ufw):

```bash
sudo ufw allow 8800/tcp
```

**Recommended:** put it behind a domain + HTTPS (Caddy/nginx) instead of a raw
`http://IP:port`, then use that `https://…` URL as `ARTLIST_RELAY_URL`.

## Endpoints

- `GET /health` — no auth; `{"status":"ok","configured":<bool>}`
- `POST /generate/video` — requires `X-Relay-Secret`; body:
  `{"prompt","model_name","duration","aspect_ratio","resolution"}`;
  returns raw `video/mp4` bytes.

## Tuning selectors (if generation fails)

Artlist ships a single-page app whose DOM changes over time. Login is well-tested,
but the **generation page** selectors are best-effort. If `/generate/video` returns
a 502 about not finding the prompt field / Generate button / result video, tune via
env vars in `.env` (comma-separated, tried in order), then restart:

```
ARTLIST_GEN_URL=https://app.artlist.io/ai/video
SEL_PROMPT=textarea[name='prompt']
SEL_GENERATE=button:has-text('Generate')
SEL_RESULT_VIDEO=video[src]
ARTLIST_DEBUG=1          # include step logs + a screenshot in error responses
ARTLIST_GEN_TIMEOUT_S=240
```

With `ARTLIST_DEBUG=1`, failures include a base64 screenshot and step logs so you
can see exactly where the automation got stuck.

## Operations

```bash
sudo systemctl status artlist-relay     # is it running?
journalctl -u artlist-relay -f          # live logs
sudo systemctl restart artlist-relay    # after editing .env
```

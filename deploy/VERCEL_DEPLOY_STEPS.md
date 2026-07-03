# Deploying the AI MARAYA backend to Vercel — same project

Everything now lives in **one** Vercel project (your existing `aimaraya-web`),
no second project needed. The backend runs as a single Python Vercel
Function at `api/index.py` (which just imports the real app from
`backend/server.py`), and `/api/*` requests are rewritten to it — same
domain, no CORS, no separate URL to wire up.

**Why I can't push this myself:** I tested it directly — my sandbox gets a
403 trying to reach github.com, npmjs.org, and even vercel.com itself. There
is no direct-upload path available to me; Vercel deployments only trigger
from a `git push` (your existing git integration) or the `vercel` CLI, and
both routes are network-blocked from where I run. The only remaining step is
yours, and it's small.

## 1. Push (the only manual step)

From your machine, in the `aimaraya` folder:

```bash
git add -A
git commit -m "Rebuild backend on Comfy Cloud + Stripe only; run as a Vercel Python function"
git push origin main
```

Your existing Vercel git integration will pick this up and redeploy
`aimaraya-web` automatically — same project, no new one created.

## 2. Add backend environment variables to the SAME project

In Vercel: `aimaraya-web` project → Settings → Environment Variables. Add
(Production + Preview):

`MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `EMERGENT_LLM_KEY`, `STRIPE_API_KEY`,
`COMFY_API_KEY`, `COMFY_BASE_URL`, `COMFY_EMAIL`, `COMFY_PASSWORD`,
`COMFY_FIREBASE_API_KEY`.

**Important:** check whether `REACT_APP_BACKEND_URL` already exists as an env
var on this project (left over from the old dead-tunnel setup). If it does,
**delete it** or set it empty — the frontend only calls same-origin `/api/...`
correctly when this var is unset (see `frontend/src/lib/api.js`). If it's
still pointing at the old tunnel URL, the site will look broken again even
though the backend is fine.

## 3. Known limits, worth knowing

- `emergentintegrations` is a private package (not on public PyPI) —
  `requirements.txt` at the repo root already has the correct
  `--extra-index-url` for it. Don't remove that line.
- Vercel Functions cap execution at 300s on Hobby (up to 800s on Pro).
  `vercel.json` sets `maxDuration: 300`, and the Comfy Cloud poll loop in
  `backend/server.py` now gives up at 260s with a clean error + credit
  refund, instead of getting hard-killed with an opaque 504. Fast image
  models are well within this; slow video models (Veo, Kling, Seedance) may
  occasionally need more — if that happens a lot, upgrade to Pro and raise
  both numbers, or move generation to a background-job pattern.
- The in-memory rate limiter isn't shared across function instances (fine to
  ship, just looser than intended under real concurrent load).

## 4. Smoke test after it redeploys

- `https://<your-domain>/api/` → `{"status":"ok","service":"AI MARAYA"}`
- Register a real account, log in.
- Generate one image.
- Buy a credit pack (Stripe test mode first), confirm `/success` shows
  credits added.

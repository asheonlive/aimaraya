# AI MARAYA - PRD

## Problem Statement
Multi-model AI generation SaaS ("AI MARAYA") like OpenArt. Every famous model (Sora 2, Veo 3.1, FLUX, Kling, Seedance, Ideogram, GPT Image, Grok, Luma, MiniMax, PixVerse, Stability, Recraft, Seedream, HappyHorse) behind one credit balance. Stripe checkout. Storyboard Agent. Highly-animated 21st.dev-style UI.

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui. Dark purple luxury theme (#0d0919 base, #a855f7/#c084fc accent). Bricolage Grotesque display + Geist body.
- **Backend**: FastAPI + Motor (Mongo) + JWT auth + emergentintegrations (Stripe + Claude for planning).
- **Generation engines**:
  - **Comfy Cloud (cloud.comfy.org)** partner nodes via user's paid Comfy account (`COMFY_API_KEY` + Firebase auth) — all 30 image/video models.
  - **Emergent Claude Sonnet 4.5** — Storyboard shot-planning agent only (no image generation).
- **DB**: users, generations, storyboards, characters, payment_transactions.

## Routes
- Public: `/`, `/pricing`, `/models`, `/explore`, `/auth`, `/success`, `/about`, `/privacy`, `/terms`, `/contact`
- App (auth): `/app` (dashboard), `/app/create-image`, `/app/create-video`, `/app/storyboard`, `/app/library`, `/app/profile`, `/app/settings`, `/app/video-editor` — plus locked/coming-soon: edit-image, edit-3d, background-change, moodboard.

## Key API endpoints
- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`
- Models: `GET /api/models`
- Generation: `POST /api/generate` (single), `POST /api/storyboard` (agent), `POST /api/storyboard/{id}/animate`
- Uploads: `POST /api/upload`, `POST /api/characters`
- Stripe: `POST /api/checkout/session`, `GET /api/checkout/status/{sid}`, `POST /api/webhook/stripe`

## Implemented (2026-02-01 → 2026-07-01)
- ✅ Auth (JWT), Stripe checkout w/ webhook, credit ledger
- ✅ 30 Comfy Cloud models catalog with capability tags (`start_frame`, `end_frame`, `camera_control`)
- ✅ Dynamic `PromptBox.jsx` (character/ref uploads, keyframe slots, Kling camera controls)
- ✅ Storyboard Agent (Claude plans shots → parallel Comfy generation via `gpt-image-1` → optional Animate All)
- ✅ Landing page — highly animated hero, Model ticker, **Seedance 2.0 video showcase**, Tools bento, Testimonials, FAQ, CTA
- ✅ Static pages (About, Privacy, Terms, Contact)
- ✅ **Profile page** (`/app/profile`) — avatar, credit balance, stats (images/videos/storyboards), quick links, prominent logout, danger zone. Avatar button in topbar links to it.

## Known constraints
- Cloudflare edge ~100s timeout. Storyboards >5 panels risk edge timeout even though backend completes (parallelized via `asyncio.gather`) — results are always saved to DB and viewable via `/api/storyboards`.
- `gpt-image-2` (OpenAIGPTImageNodeV2) uses Comfy's `COMFY_DYNAMICCOMBO_V3` schema which we couldn't successfully serialize (marked `available=False`). Storyboard falls back to `gpt-image-1`.

## Bug fixes 2026-07-01
- **P0 Storyboard broken** → Fixed. Root cause: `gpt-image-2` DYNAMICCOMBO_V3 payload rejected by Comfy. Switched storyboard to `gpt-image-1` (works). Parallelized panel generation with `asyncio.gather`.
- **Missing logout / user area** → Added dedicated `/app/profile` page + avatar button in topbar.
- **Landing missing Seedance promo** → Added dedicated Seedance 2.0 showcase section (6 video cards, hover-to-play, pricing badges).

## Backlog / Next
- [ ] Reliable long-running storyboard: convert to background job + poll (bypass 100s edge cap for 6-8 panel jobs).
- [ ] Solve `gpt-image-2` COMFY_DYNAMICCOMBO_V3 serialization (research/spike).
- [ ] Real Seedance-generated sample videos on landing (currently uses stock demo mp4s labelled with Seedance branding).
- [ ] Video editor page enhancements.

## Environment
- `/app/backend/.env`: MONGO_URL, DB_NAME, JWT_SECRET, EMERGENT_LLM_KEY, STRIPE_API_KEY, COMFY_API_KEY, COMFY_BASE_URL, COMFY_EMAIL, COMFY_PASSWORD, COMFY_FIREBASE_API_KEY.

## Test credentials → `/app/memory/test_credentials.md`

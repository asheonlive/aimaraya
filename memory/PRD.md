# Maraya AI - PRD

## Problem Statement
User wants a website like AI Maraya / OpenArt — multi-model AI generation SaaS featuring all famous models. Stripe integration. Professional design.

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui. Dark luxury theme (Bricolage Grotesque + Geist + Geist Mono). Accent #E1FF01 cyber-yellow on absolute black.
- **Backend**: FastAPI + Motor (Mongo) + JWT auth + emergentintegrations.
- **Generation engines**:
  - Gemini (Nano Banana + Nano Banana Pro) via Emergent Universal LLM key.
  - **Comfy Cloud (cloud.comfy.org) partner nodes** via user's paid Comfy Cloud account — FLUX 1.1 Pro Ultra, FLUX 1.1 Pro, Recraft V3, Seedance Pro/Fast, Kling 3 Omni, Veo 3.1 Fast, Grok Imagine, Luma Ray Flash, PixVerse, MiniMax Hailuo.
- **DB collections**: users, generations, payment_transactions.

## Live models (Feb 2026)
13 models total — all `available=True`:
- Image: nano-banana, nano-banana-pro, flux-pro-ultra, flux-pro, recraft-v3
- Video: seedance-pro, seedance-fast, kling, veo-3, grok-imagine, luma-ray, pixverse, hailuo

## Routes
- `/` landing  · `/models` catalog · `/studio` generation UI · `/dashboard` user gallery · `/pricing` Stripe packs · `/explore` community feed · `/auth` login/register · `/success` post-checkout

## Implemented
- JWT email/password auth with bcrypt + 20 welcome credits.
- 13-model catalog with metadata + per-engine workflow builder (`models_catalog.py`).
- Live image + video generation via Comfy Cloud partner nodes (smoke-tested with FLUX Pro Ultra → success in ~15s) plus Gemini Nano Banana via Emergent key.
- Generation history per user + community Explore feed.
- Stripe checkout for 3 credit packs ($9 / $29 / $99) using emergentintegrations + polling on `/success`.
- Static-file serving of generated PNGs/MP4s at `/api/media/*` with relative URLs (HTTPS-safe).

## Backlog
- P1: Reference-image upload (image-to-image, character ref) — Comfy upload endpoint already in client (`upload_input_file`).
- P1: Monthly subscription tiers in addition to one-time packs.
- P2: Public share pages + social OG cards.
- P2: Comfy job webhook callbacks (currently polled).
- P2: Per-user rate limit + abuse detection.

## Personas
- Indie creator (Nano Banana for social posts)
- Ad agency producer (FLUX Pro Ultra + Veo / Kling)
- Telegram bot operator migrating to web (the user)

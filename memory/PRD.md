# Maraya AI - PRD

## Problem Statement
User wants a website like AI Maraya / OpenArt — a multi-model AI generation SaaS featuring all famous models (Nano Banana, Midjourney v7/v8, FLUX, GPT Image 1, Grok Imagine, Sora 2, Veo 3.1, Kling, Seedance, Wan 2.7, HappyHorse). Stripe integration required. Professional design.

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui. Dark luxury theme (Bricolage Grotesque + Geist + Geist Mono). Accent #E1FF01 cyber-yellow on absolute black.
- **Backend**: FastAPI + Motor (Mongo) + JWT auth + emergentintegrations (Gemini image gen + Stripe checkout).
- **DB collections**: users, generations, payment_transactions.

## Routes
- `/` landing  · `/models` catalog · `/studio` generation UI · `/dashboard` user gallery · `/pricing` Stripe packs · `/explore` community feed · `/auth` login/register · `/success` post-checkout

## Implemented (Feb 2026)
- JWT email/password auth with bcrypt + 20 welcome credits.
- 16-model catalog with metadata (image/video, category, credits, availability).
- Live image generation via Gemini Nano Banana (default + pro). Other 14 models surfaced as "Coming soon".
- Generation history per user + community Explore feed.
- Stripe checkout for 3 credit packs ($9 / $29 / $99) using emergentintegrations + polling on `/success`.
- Static-file serving of generated PNGs at `/api/media/*`.

## Backlog (Priority)
- P0: Connect Sora 2 + Veo + Kling + FLUX endpoints (currently UI-only)
- P1: Reference-image upload (image-to-image, character ref)
- P1: Subscription tier (monthly) in addition to one-time packs
- P2: Public profile pages + share links
- P2: Team accounts + API keys

## Personas
- Indie creator (uses Nano Banana for social posts)
- Ad agency producer (needs Midjourney v8 + Sora 2)
- Telegram bot operator migrating to web (the user)

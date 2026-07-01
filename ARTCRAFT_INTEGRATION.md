# ArtCraft Website Integration

The website backend now routes supported `/api/generate` requests through an
ArtCraft account pool before falling back to the old Comfy/Gemini paths.

## Required Server Files

- `backend/.env` with the existing website values:
  - `MONGO_URL`
  - `DB_NAME`
  - `JWT_SECRET`
  - `EMERGENT_LLM_KEY`
  - `STRIPE_API_KEY`
- ArtCraft pool file:
  - `ARTCRAFT_ACCOUNTS_FILE=/opt/tg_video_bot/artcraft_accounts.txt`
  - Format: one `email:password` per line

## Optional ArtCraft Settings

- `ARTCRAFT_ENABLED=true`
- `ARTCRAFT_VIDEO_TIMEOUT_SECONDS=900`
- `ARTCRAFT_IMAGE_TIMEOUT_SECONDS=300`
- `ARTCRAFT_ACCOUNT_RECHECK_SECONDS=600`

## Frontend Setting

Set `REACT_APP_BACKEND_URL` to the public backend origin, for example:

```bash
REACT_APP_BACKEND_URL=https://your-api.example.com
```

## Supported ArtCraft Model Mappings

Video:

- `sora-2` -> `sora_2`
- `sora-2-pro` -> `sora_2_pro`
- `veo-3.1-fast` -> `veo_3p1_fast`
- `veo-2` -> `veo_2`
- `kling-omni` -> `kling_3p0_pro`
- `seedance-pro` -> `seedance_2p0`
- `seedance-fast` -> `seedance_2p0_bp`
- `grok-video` -> `grok_imagine_video`
- `happyhorse` -> `happy_horse_1p0`

Image:

- `nano-banana` -> `nano_banana`
- `nano-banana-2` -> `nano_banana_2`
- `nano-banana-pro` -> `nano_banana_pro`
- `gpt-image-2` -> `gpt_image_2`
- `grok-image` -> `grok_image`
- `flux-1.1-ultra` -> `flux_pro_1p1_ultra`

## Deploy Checklist

1. Install backend dependencies: `pip install -r backend/requirements.txt`
2. Put the paid ArtCraft accounts file on the server.
3. Set `ARTCRAFT_ACCOUNTS_FILE` to that file path.
4. Start the backend with Uvicorn, for example:
   `uvicorn backend.server:app --host 0.0.0.0 --port 8000`
5. Build the frontend with `REACT_APP_BACKEND_URL` pointing to the backend.
6. Keep the Telegram bot running separately for account creation and payment verification.

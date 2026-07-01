"""Maraya AI - Multi-model AI generation platform backend."""
import os
import uuid
import base64
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

from models_catalog import (
    MODELS,
    public_catalog,
    find_model,
    build_comfy_workflow,
)
from comfy_cloud_client import ComfyCloudClient, ComfyCloudError, collect_output_files
from artcraft_client import ArtCraftClient, ArtCraftError, ArtCraftPool

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- Setup ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
JWT_ALG = "HS256"

GENERATED_DIR = ROOT_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Maraya AI API")
api = APIRouter(prefix="/api")
app.mount("/api/media", StaticFiles(directory=str(GENERATED_DIR)), name="media")
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maraya")

# Comfy client singleton
comfy = ComfyCloudClient(
    api_key=os.environ.get("COMFY_API_KEY", ""),
    base_url=os.environ.get("COMFY_BASE_URL", "https://cloud.comfy.org"),
    email=os.environ.get("COMFY_EMAIL", ""),
    password=os.environ.get("COMFY_PASSWORD", ""),
    firebase_api_key=os.environ.get("COMFY_FIREBASE_API_KEY", ""),
)
artcraft_pool = ArtCraftPool()

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

def _artcraft_enabled() -> bool:
    return os.environ.get("ARTCRAFT_ENABLED", "true").lower() in {"1", "true", "yes", "on"}

def _artcraft_model_id(model: dict) -> Optional[str]:
    if model["type"] == "video":
        return ARTCRAFT_VIDEO_MODELS.get(model["id"])
    return ARTCRAFT_IMAGE_MODELS.get(model["id"])

# ---------- Schemas ----------
class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class GenerateReq(BaseModel):
    prompt: str
    model_id: str = "nano-banana"
    aspect_ratio: Optional[str] = "1:1"
    duration: Optional[str] = "5s"
    resolution: Optional[str] = "1K"
    ref_image_url: Optional[str] = None
    character_id: Optional[str] = None
    start_frame_url: Optional[str] = None
    end_frame_url: Optional[str] = None
    camera_control: Optional[str] = None

class CheckoutReq(BaseModel):
    package_id: str
    origin_url: str

PACKAGES = {
    "starter": {"name": "Starter", "amount": 12.00, "currency": "usd", "credits": 3000},
    "pro":     {"name": "Pro",     "amount": 29.00, "currency": "usd", "credits": 10000},
    "ultra":   {"name": "Ultra",   "amount": 59.00, "currency": "usd", "credits": 30000},
}

# ---------- Auth helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, h: str) -> bool:
    return bcrypt.checkpw(pw.encode(), h.encode())

def make_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=14)},
        JWT_SECRET, algorithm=JWT_ALG,
    )

async def current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")

def public_user(u: dict) -> dict:
    return {k: u[k] for k in ("id", "email", "name", "credits", "created_at") if k in u}

# ---------- Generation engines ----------
async def _generate_gemini(model: dict, prompt: str, aspect_ratio: str) -> tuple[str, str]:
    """Returns (filename, mime_ext)."""
    session_id = f"gen-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY, session_id=session_id,
        system_message="You are an expert AI image generator. Create stunning, detailed visuals.",
    )
    chat.with_model("gemini", model["engine"]).with_params(modalities=["image", "text"])
    full_prompt = f"{prompt}. Aspect ratio: {aspect_ratio}. High quality, detailed."
    _text, images = await chat.send_message_multimodal_response(UserMessage(text=full_prompt))
    if not images:
        raise RuntimeError("No image returned from model.")
    img = images[0]
    ext = "jpg" if "jpeg" in img.get("mime_type", "") else "png"
    fname = f"{uuid.uuid4()}.{ext}"
    (GENERATED_DIR / fname).write_bytes(base64.b64decode(img["data"]))
    return fname, ext


# Models that accept an image_prompt input for image-to-image / reference guidance.
COMFY_IMAGE_INPUT_FIELD = {
    "flux-kontext-pro": "image_prompt",
    "flux-kontext-max": "image_prompt",
    "flux-1.1-ultra": "image_prompt",
    "flux-2-pro": "image_prompt",
}


async def _generate_comfy(model: dict, prompt: str, aspect_ratio: str,
                          ref_local_path: Optional[Path] = None,
                          start_local_path: Optional[Path] = None,
                          end_local_path: Optional[Path] = None,
                          camera_control: Optional[str] = None) -> tuple[str, str]:
    """Submit workflow to Comfy Cloud, poll, download output.
    Supports reference image (image-prompt), start/end keyframes and camera control
    for models whose `caps` declare the corresponding input fields."""
    extra: dict = {}
    node_counter = 3  # next available node id in workflow
    caps = model.get("caps") or {}
    workflow_extra_nodes: dict[str, dict] = {}

    async def _upload_and_node(path: Path) -> Optional[str]:
        nonlocal node_counter
        try:
            up = await comfy.upload_input_file(path)
            uploaded = up.get("name")
            if not uploaded:
                return None
            node_id = str(node_counter); node_counter += 1
            workflow_extra_nodes[node_id] = {"class_type": "LoadImage",
                                             "inputs": {"image": uploaded}}
            return node_id
        except Exception as e:
            logger.warning("Ref upload failed: %s", e)
            return None

    # Start frame → maps to caps.start_frame field name
    if start_local_path and caps.get("start_frame"):
        nid = await _upload_and_node(start_local_path)
        if nid: extra[caps["start_frame"]] = [nid, 0]

    # End frame → maps to caps.end_frame
    if end_local_path and caps.get("end_frame"):
        nid = await _upload_and_node(end_local_path)
        if nid: extra[caps["end_frame"]] = [nid, 0]

    # Camera control
    if camera_control and caps.get("camera_control"):
        extra[caps["camera_control"]] = camera_control

    # Legacy: image_prompt style reference for FLUX Kontext/etc.
    if ref_local_path and model["id"] in COMFY_IMAGE_INPUT_FIELD and "image_prompt" not in extra:
        nid = await _upload_and_node(ref_local_path)
        if nid:
            field = COMFY_IMAGE_INPUT_FIELD[model["id"]]
            extra[field] = [nid, 0]

    workflow = build_comfy_workflow(model, prompt, aspect_ratio, extra_inputs=extra)
    workflow.update(workflow_extra_nodes)
    prompt_id = await comfy.submit_workflow(workflow, needs_auth=True)

    # Poll status (videos can take a few minutes)
    deadline = asyncio.get_event_loop().time() + 600  # 10 min hard cap
    poll_interval = 3.0
    while asyncio.get_event_loop().time() < deadline:
        try:
            status = await comfy.job_status(prompt_id)
        except ComfyCloudError as e:
            logger.warning("status poll failed: %s", e)
            status = {}
        s = (status.get("status") or status.get("state") or "").lower()
        if s in ("completed", "success", "succeeded", "done"):
            break
        if s in ("failed", "error", "cancelled", "canceled"):
            raise RuntimeError(f"Comfy job {prompt_id} failed: {status}")
        await asyncio.sleep(poll_interval)
        poll_interval = min(poll_interval * 1.2, 8.0)
    else:
        raise RuntimeError("Generation timed out after 10 minutes.")

    details = await comfy.job_details(prompt_id)
    files = collect_output_files(details)
    if not files:
        raise RuntimeError("Comfy job finished but produced no output files.")
    item = files[0]
    src_url = comfy.file_url(item)
    ext = Path(item.get("filename", "out.bin")).suffix.lstrip(".") or ("mp4" if model["type"] == "video" else "png")
    fname = f"{uuid.uuid4()}.{ext}"
    await comfy.download_file(src_url, GENERATED_DIR / fname)
    return fname, ext


async def _generate_artcraft(
    model: dict,
    prompt: str,
    aspect_ratio: str,
    duration: str,
    resolution: str,
    ref_local_path: Optional[Path] = None,
    start_local_path: Optional[Path] = None,
    end_local_path: Optional[Path] = None,
) -> str:
    provider_model = _artcraft_model_id(model)
    if not provider_model:
        raise ArtCraftError(f"{model['name']} is not mapped to ArtCraft.")

    last_error: Exception | None = None
    attempts = max(1, artcraft_pool.summary()["total"])
    for _ in range(attempts):
        client: ArtCraftClient | None = None
        try:
            client = await artcraft_pool.borrow()
            credits = await client.credits()
            if credits <= 0:
                await artcraft_pool.block(client)
                continue

            if model["type"] == "video":
                job_id = await client.generate_video(
                    prompt=prompt,
                    model=provider_model,
                    aspect_ratio=aspect_ratio,
                    duration=duration or "5s",
                    resolution=resolution or "720p",
                    ref_image=start_local_path or ref_local_path,
                    end_image=end_local_path,
                )
                timeout = int(os.environ.get("ARTCRAFT_VIDEO_TIMEOUT_SECONDS", "900"))
            else:
                job_id = await client.generate_image(
                    prompt=prompt,
                    model=provider_model,
                    aspect_ratio=aspect_ratio,
                    resolution=resolution or "1K",
                    ref_image=ref_local_path,
                )
                timeout = int(os.environ.get("ARTCRAFT_IMAGE_TIMEOUT_SECONDS", "300"))

            url = await client.poll_job(job_id, timeout)
            await artcraft_pool.release(client)
            return url
        except Exception as exc:
            last_error = exc
            if client:
                text = str(exc).lower()
                if "login" in text or "credit" in text:
                    await artcraft_pool.block(client)
                else:
                    await artcraft_pool.release(client)
    raise ArtCraftError("ArtCraft generation is unavailable.") from last_error


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "Maraya AI", "artcraft": artcraft_pool.summary()}

@api.get("/models")
async def get_models():
    return {"models": public_catalog()}

@api.get("/packages")
async def get_packages():
    return {"packages": [{"id": k, **v} for k, v in PACKAGES.items()]}

# --- Auth ---
@api.post("/auth/register")
async def register(req: RegisterReq):
    if await db.users.find_one({"email": req.email.lower()}):
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id, "email": req.email.lower(),
        "name": req.name or req.email.split("@")[0],
        "password": hash_pw(req.password),
        "credits": 100,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return {"token": make_token(user_id), "user": public_user(doc)}

@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_pw(req.password, user["password"]):
        raise HTTPException(400, "Invalid email or password")
    return {"token": make_token(user["id"]), "user": public_user(user)}

@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return {"user": public_user(user)}

# --- Generation ---
@api.post("/generate")
async def generate(req: GenerateReq, user=Depends(current_user)):
    model = find_model(req.model_id)
    if not model:
        raise HTTPException(400, "Unknown model")
    if not model["available"]:
        raise HTTPException(400, f"{model['name']} is not available right now.")
    cost = model["credits"]
    if user["credits"] < cost:
        raise HTTPException(402, "Insufficient credits. Upgrade your plan.")

    # Atomic deduct
    res = await db.users.find_one_and_update(
        {"id": user["id"], "credits": {"$gte": cost}},
        {"$inc": {"credits": -cost}},
        return_document=True,
    )
    if not res:
        raise HTTPException(402, "Insufficient credits")

    try:
        # Resolve reference images
        def _local(url: Optional[str]) -> Optional[Path]:
            if not url: return None
            fname = url.rsplit("/", 1)[-1]
            p = UPLOADS_DIR / fname
            return p if p.exists() else None

        ref_local = _local(req.ref_image_url)
        start_local = _local(req.start_frame_url)
        end_local = _local(req.end_frame_url)

        char = None
        if req.character_id:
            char = await db.characters.find_one({"id": req.character_id, "user_id": user["id"]})
            if char and not ref_local:
                ref_local = UPLOADS_DIR / char["filename"]

        effective_prompt = req.prompt
        if char:
            effective_prompt = f"{req.prompt} — Featuring character '{char['name']}'"

        if _artcraft_enabled() and _artcraft_model_id(model):
            media_url = await _generate_artcraft(
                model,
                effective_prompt,
                req.aspect_ratio,
                req.duration or "5s",
                req.resolution or ("720p" if model["type"] == "video" else "1K"),
                ref_local_path=ref_local,
                start_local_path=start_local,
                end_local_path=end_local,
            )
            fname = media_url
        elif model["engine_type"] == "gemini":
            fname, _ext = await _generate_gemini(model, effective_prompt, req.aspect_ratio)
            media_url = f"/api/media/{fname}"
        elif model["engine_type"] == "comfy":
            fname, _ext = await _generate_comfy(
                model, effective_prompt, req.aspect_ratio,
                ref_local_path=ref_local,
                start_local_path=start_local,
                end_local_path=end_local,
                camera_control=req.camera_control,
            )
            media_url = f"/api/media/{fname}"
        else:
            raise RuntimeError(f"Unknown engine_type: {model['engine_type']}")

        gen_id = str(uuid.uuid4())
        gen_doc = {
            "id": gen_id, "user_id": user["id"], "prompt": req.prompt,
            "model_id": req.model_id, "model_name": model["name"],
            "type": model["type"], "media_url": media_url, "filename": fname,
            "aspect_ratio": req.aspect_ratio, "credits_used": cost,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.generations.insert_one(gen_doc)
        gen_doc.pop("_id", None)
        return {"generation": gen_doc, "credits_remaining": user["credits"] - cost}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Generation failed")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"credits": cost}})
        raise HTTPException(500, f"Generation failed: {str(e)[:300]}")

@api.get("/generations")
async def list_generations(user=Depends(current_user)):
    docs = await db.generations.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return {"generations": docs}

@api.delete("/generations/{gen_id}")
async def delete_generation(gen_id: str, user=Depends(current_user)):
    doc = await db.generations.find_one({"id": gen_id})
    if not doc or doc["user_id"] != user["id"]:
        raise HTTPException(404, "Not found")
    # Best-effort remove file
    try:
        (GENERATED_DIR / doc["filename"]).unlink(missing_ok=True)
    except Exception:
        pass
    await db.generations.delete_one({"id": gen_id})
    return {"ok": True}

@api.post("/generations/{gen_id}/publish")
async def publish_generation(gen_id: str, user=Depends(current_user)):
    doc = await db.generations.find_one({"id": gen_id})
    if not doc or doc["user_id"] != user["id"]:
        raise HTTPException(404, "Not found")
    await db.generations.update_one({"id": gen_id}, {"$set": {"public": True}})
    return {"ok": True, "public": True}

# --- Uploads (image references) ---
_ALLOWED = {"image/png", "image/jpeg", "image/webp", "image/gif"}

@api.post("/upload")
async def upload_ref(file: UploadFile = File(...), user=Depends(current_user)):
    if file.content_type not in _ALLOWED:
        raise HTTPException(400, "Unsupported file type")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(400, "File too large (15MB max)")
    ext = (file.filename.rsplit(".", 1)[-1] or "png").lower()
    if ext not in ("png", "jpg", "jpeg", "webp", "gif"):
        ext = "png"
    fname = f"{user['id']}_{uuid.uuid4()}.{ext}"
    (UPLOADS_DIR / fname).write_bytes(data)
    return {"url": f"/api/uploads/{fname}", "filename": fname}

# --- Characters (reusable references) ---
@api.get("/characters")
async def list_characters(user=Depends(current_user)):
    docs = await db.characters.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"characters": docs}

@api.post("/characters")
async def create_character(
    name: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(current_user),
):
    if file.content_type not in _ALLOWED:
        raise HTTPException(400, "Unsupported file type")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(400, "File too large (15MB max)")
    ext = (file.filename.rsplit(".", 1)[-1] or "png").lower()
    if ext not in ("png", "jpg", "jpeg", "webp"):
        ext = "png"
    fname = f"char_{user['id']}_{uuid.uuid4()}.{ext}"
    (UPLOADS_DIR / fname).write_bytes(data)
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "name": name.strip()[:60] or "Untitled",
        "image_url": f"/api/uploads/{fname}",
        "filename": fname,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.characters.insert_one(doc)
    doc.pop("_id", None)
    return {"character": doc}

@api.delete("/characters/{char_id}")
async def delete_character(char_id: str, user=Depends(current_user)):
    doc = await db.characters.find_one({"id": char_id})
    if not doc or doc["user_id"] != user["id"]:
        raise HTTPException(404, "Not found")
    try:
        (UPLOADS_DIR / doc["filename"]).unlink(missing_ok=True)
    except Exception:
        pass
    await db.characters.delete_one({"id": char_id})
    return {"ok": True}

# --- Stripe ---
@api.post("/checkout/session")
async def create_checkout(req: CheckoutReq, http_request: Request, user=Depends(current_user)):
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]
    origin = req.origin_url.rstrip("/")
    success_url = f"{origin}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"

    host_url = str(http_request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {"user_id": user["id"], "package_id": req.package_id, "credits": str(pkg["credits"])}
    creq = CheckoutSessionRequest(
        amount=float(pkg["amount"]), currency=pkg["currency"],
        success_url=success_url, cancel_url=cancel_url, metadata=metadata,
    )
    session = await stripe.create_checkout_session(creq)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "user_id": user["id"],
        "package_id": req.package_id, "amount": pkg["amount"], "currency": pkg["currency"],
        "credits": pkg["credits"], "payment_status": "initiated", "status": "pending",
        "credited": False, "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}

@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, http_request: Request, user=Depends(current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Session not found")
    if txn["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")

    host_url = str(http_request.base_url).rstrip("/")
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    status = await stripe.get_checkout_status(session_id)

    update = {"payment_status": status.payment_status, "status": status.status}
    credits_added = 0
    if status.payment_status == "paid" and not txn.get("credited"):
        update["credited"] = True
        credits_added = txn["credits"]
        await db.users.update_one({"id": txn["user_id"]}, {"$inc": {"credits": credits_added}})
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    return {
        "payment_status": status.payment_status, "status": status.status,
        "amount_total": status.amount_total, "currency": status.currency,
        "credits_added": credits_added,
    }

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    host_url = str(request.base_url).rstrip("/")
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    try:
        evt = await stripe.handle_webhook(body, sig)
    except Exception as e:
        raise HTTPException(400, f"Invalid webhook: {e}")
    if evt.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": evt.session_id})
        if txn and not txn.get("credited"):
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"payment_status": "paid", "status": "complete", "credited": True}},
            )
            await db.users.update_one({"id": txn["user_id"]}, {"$inc": {"credits": txn["credits"]}})
    return {"received": True}

@api.get("/explore")
async def explore():
    docs = await db.generations.find({"public": True}, {"_id": 0, "user_id": 0, "filename": 0}).sort("created_at", -1).limit(48).to_list(48)
    return {"generations": docs}

# --- Storyboard agent ---
class StoryboardReq(BaseModel):
    concept: str
    panels: int = 6
    style: Optional[str] = "cinematic"
    image_model: Optional[str] = "gpt-image-1"

class AnimateReq(BaseModel):
    video_model: str = "seedance-fast"

STORY_SYSTEM = (
    "You are a cinematic storyboard director. Break a concept into a numbered sequence of shots. "
    "For each shot, write a single vivid image-generation prompt (~30-45 words) describing camera angle, "
    "subject, action, lighting and mood. Return ONLY a JSON object with a 'shots' array."
)

async def _plan_shots(concept: str, panels: int, style: str) -> list[str]:
    """Use Emergent LLM (Claude) to plan N shots. Returns list of prompts."""
    import json as _json
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"story-{uuid.uuid4()}",
                   system_message=STORY_SYSTEM)
    chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    ask = (
        f"Concept: {concept}\n"
        f"Style: {style}\n"
        f"Number of shots: {panels}\n"
        "Return JSON: {\"shots\": [\"shot1 prompt\", \"shot2 prompt\", ...]}. "
        "Absolutely no other text."
    )
    text = await chat.send_message(UserMessage(text=ask))
    # Extract JSON — model may wrap it in ```json
    raw = text.strip()
    if "```" in raw:
        parts = raw.split("```")
        for p in parts:
            if "{" in p:
                raw = p.replace("json", "", 1).strip(); break
    try:
        data = _json.loads(raw)
        shots = data.get("shots") or data.get("panels") or []
    except Exception:
        # Fallback: split by newline
        shots = [line.strip("-•* 0123456789.") for line in raw.split("\n") if len(line.strip()) > 15][:panels]
    return [s for s in shots if s][:panels]


@api.post("/storyboard")
async def create_storyboard(req: StoryboardReq, user=Depends(current_user)):
    panels = max(3, min(int(req.panels or 6), 8))
    image_model = find_model(req.image_model or "gpt-image-1")
    if not image_model or image_model.get("type") != "image" or not image_model.get("available"):
        # Fallback to a proven image model
        image_model = find_model("gpt-image-1")
    if not image_model:
        raise HTTPException(500, "Storyboard image model not configured")

    cost_per_panel = image_model["credits"]
    total_cost = cost_per_panel * panels + 2  # +2 for LLM planning
    if user["credits"] < total_cost:
        raise HTTPException(402, "Insufficient credits for storyboard")

    # Atomic deduct
    res = await db.users.find_one_and_update(
        {"id": user["id"], "credits": {"$gte": total_cost}},
        {"$inc": {"credits": -total_cost}}, return_document=True,
    )
    if not res:
        raise HTTPException(402, "Insufficient credits")

    story_id = str(uuid.uuid4())
    try:
        shots = await _plan_shots(req.concept, panels, req.style or "cinematic")
        if not shots:
            raise RuntimeError("Agent failed to produce shot list.")

        async def _one_panel(idx: int, shot_prompt: str) -> dict:
            try:
                fname, _ = await _generate_comfy(image_model, shot_prompt, "1:1", None)
                return {"id": str(uuid.uuid4()), "index": idx, "prompt": shot_prompt,
                        "media_url": f"/api/media/{fname}", "filename": fname,
                        "video_url": None, "video_status": None}
            except Exception as e:
                logger.exception("Panel %d failed", idx)
                return {"id": str(uuid.uuid4()), "index": idx, "prompt": shot_prompt,
                        "media_url": None, "filename": None,
                        "video_url": None, "video_status": "failed",
                        "error": str(e)[:200]}

        # Generate panels concurrently — Comfy Cloud handles queuing.
        panel_docs = await asyncio.gather(*[_one_panel(i, s) for i, s in enumerate(shots, start=1)])

        doc = {
            "id": story_id,
            "user_id": user["id"],
            "concept": req.concept,
            "style": req.style,
            "panels": panel_docs,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "credits_used": total_cost,
        }
        await db.storyboards.insert_one(doc)
        doc.pop("_id", None)
        return {"storyboard": doc, "credits_remaining": user["credits"] - total_cost}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Storyboard failed")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"credits": total_cost}})
        raise HTTPException(500, f"Storyboard failed: {str(e)[:300]}")


@api.get("/storyboards")
async def list_storyboards(user=Depends(current_user)):
    docs = await db.storyboards.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"storyboards": docs}


@api.get("/storyboards/{story_id}")
async def get_storyboard(story_id: str, user=Depends(current_user)):
    doc = await db.storyboards.find_one({"id": story_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Storyboard not found")
    return {"storyboard": doc}


@api.post("/storyboard/{story_id}/animate")
async def animate_storyboard(story_id: str, req: AnimateReq, user=Depends(current_user)):
    story = await db.storyboards.find_one({"id": story_id, "user_id": user["id"]})
    if not story:
        raise HTTPException(404, "Storyboard not found")
    v_model = find_model(req.video_model)
    if not v_model or v_model["type"] != "video" or not v_model["available"]:
        raise HTTPException(400, "Invalid video model")

    panels = story["panels"]
    valid_panels = [p for p in panels if p.get("media_url")]
    total_cost = v_model["credits"] * len(valid_panels)
    if user["credits"] < total_cost:
        raise HTTPException(402, "Insufficient credits to animate all panels")
    # Deduct upfront
    res = await db.users.find_one_and_update(
        {"id": user["id"], "credits": {"$gte": total_cost}},
        {"$inc": {"credits": -total_cost}}, return_document=True,
    )
    if not res:
        raise HTTPException(402, "Insufficient credits")

    async def _animate_one(p: dict) -> tuple[dict, int]:
        if not p.get("media_url"):
            return p, 0
        try:
            fname, _ = await _generate_comfy(v_model, p["prompt"], "16:9", None)
            p["video_url"] = f"/api/media/{fname}"
            p["video_status"] = "ready"
            return p, 0
        except Exception as e:
            logger.warning("Animate panel %d failed: %s", p.get("index"), e)
            p["video_status"] = "failed"
            p["error"] = str(e)[:200]
            return p, v_model["credits"]

    results = await asyncio.gather(*[_animate_one(p) for p in panels])
    panels = [r[0] for r in results]
    refund = sum(r[1] for r in results)

    if refund:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"credits": refund}})
    await db.storyboards.update_one({"id": story_id}, {"$set": {"panels": panels, "video_model": req.video_model}})
    story["panels"] = panels
    story.pop("_id", None)
    return {"storyboard": story, "credits_remaining": user["credits"] - total_cost + refund}

app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()

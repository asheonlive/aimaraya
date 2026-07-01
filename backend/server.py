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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
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

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Maraya AI API")
api = APIRouter(prefix="/api")
app.mount("/api/media", StaticFiles(directory=str(GENERATED_DIR)), name="media")

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


async def _generate_comfy(model: dict, prompt: str, aspect_ratio: str) -> tuple[str, str]:
    """Submit workflow to Comfy Cloud, poll, download output."""
    workflow = build_comfy_workflow(model, prompt, aspect_ratio)
    # Partner nodes (FLUX, Kling, Veo, etc) require auth_token_comfy_org
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


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "Maraya AI"}

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
        if model["engine_type"] == "gemini":
            fname, _ext = await _generate_gemini(model, req.prompt, req.aspect_ratio)
        elif model["engine_type"] == "comfy":
            fname, _ext = await _generate_comfy(model, req.prompt, req.aspect_ratio)
        else:
            raise RuntimeError(f"Unknown engine_type: {model['engine_type']}")

        media_url = f"/api/media/{fname}"
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
    docs = await db.generations.find({}, {"_id": 0, "user_id": 0, "filename": 0}).sort("created_at", -1).limit(24).to_list(24)
    return {"generations": docs}

app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()

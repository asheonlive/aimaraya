"""Maraya AI - Multi-model AI generation platform backend."""
import os
import uuid
import base64
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

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

# Serve generated media
app.mount("/api/media", StaticFiles(directory=str(GENERATED_DIR)), name="media")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maraya")

# ---------- Models ----------
class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class GenerateReq(BaseModel):
    prompt: str
    model_id: str = "nano-banana"  # frontend selector
    aspect_ratio: Optional[str] = "1:1"

class CheckoutReq(BaseModel):
    package_id: str
    origin_url: str

# ---------- Catalog ----------
MODELS_CATALOG = [
    {"id": "nano-banana", "name": "Nano Banana", "type": "image", "category": "Artistic", "credits": 1, "available": True, "tagline": "Fast, vivid Gemini image gen", "engine": "gemini-3.1-flash-image-preview"},
    {"id": "nano-banana-pro", "name": "Nano Banana Pro", "type": "image", "category": "Hyper-Realistic", "credits": 2, "available": True, "tagline": "Premium Gemini image model", "engine": "gemini-3-pro-image-preview"},
    {"id": "gpt-image-1", "name": "GPT Image 1", "type": "image", "category": "Realistic", "credits": 3, "available": False, "tagline": "OpenAI's flagship image model"},
    {"id": "flux", "name": "FLUX", "type": "image", "category": "Cinematic", "credits": 3, "available": False, "tagline": "Cinematic detail"},
    {"id": "flux-pro-ultra", "name": "FLUX Pro Ultra", "type": "image", "category": "Cinematic", "credits": 4, "available": False, "tagline": "Maximum quality"},
    {"id": "midjourney-v7", "name": "Midjourney v7", "type": "image", "category": "Creative", "credits": 4, "available": False, "tagline": "Artistic mastery"},
    {"id": "midjourney-v8", "name": "Midjourney v8", "type": "image", "category": "Hyper-Realistic", "credits": 5, "available": False, "tagline": "Latest artistic frontier"},
    {"id": "midjourney-niji", "name": "Midjourney Niji", "type": "image", "category": "Anime", "credits": 4, "available": False, "tagline": "Anime style perfection"},
    {"id": "grok-imagine", "name": "Grok Imagine", "type": "image", "category": "Unrestricted", "credits": 3, "available": False, "tagline": "xAI uncensored creativity"},
    {"id": "sora-2", "name": "Sora 2", "type": "video", "category": "Cinematic", "credits": 12, "available": False, "tagline": "OpenAI cinematic video"},
    {"id": "veo-3", "name": "Veo 3", "type": "video", "category": "High-Fidelity", "credits": 10, "available": False, "tagline": "Google's flagship video AI"},
    {"id": "veo-3.1", "name": "Veo 3.1", "type": "video", "category": "High-Fidelity", "credits": 11, "available": False, "tagline": "Latest Veo with audio"},
    {"id": "kling", "name": "Kling 2.0", "type": "video", "category": "Action", "credits": 8, "available": False, "tagline": "Cinematic motion control"},
    {"id": "seedance", "name": "Seedance", "type": "video", "category": "Animation", "credits": 8, "available": False, "tagline": "Reference-driven character video"},
    {"id": "wan-2.7", "name": "Wan 2.7", "type": "video", "category": "Surreal", "credits": 7, "available": False, "tagline": "Surreal cinematic audio"},
    {"id": "happyhorse", "name": "HappyHorse", "type": "video", "category": "Experimental", "credits": 6, "available": False, "tagline": "Experimental motion AI"},
]

PACKAGES = {
    "starter": {"name": "Starter", "amount": 9.00, "currency": "usd", "credits": 100},
    "pro": {"name": "Pro", "amount": 29.00, "currency": "usd", "credits": 500},
    "premium": {"name": "Premium", "amount": 99.00, "currency": "usd", "credits": 2000},
}

# ---------- Auth helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

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

# ---------- Routes ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "Maraya AI"}

@api.get("/models")
async def get_models():
    return {"models": MODELS_CATALOG}

@api.get("/packages")
async def get_packages():
    return {"packages": [{"id": k, **v} for k, v in PACKAGES.items()]}

# --- Auth ---
@api.post("/auth/register")
async def register(req: RegisterReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name or req.email.split("@")[0],
        "password": hash_pw(req.password),
        "credits": 20,  # welcome credits
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
async def generate(req: GenerateReq, request: Request, user=Depends(current_user)):
    model = next((m for m in MODELS_CATALOG if m["id"] == req.model_id), None)
    if not model:
        raise HTTPException(400, "Unknown model")
    if not model["available"]:
        raise HTTPException(400, f"{model['name']} is launching soon. Try Nano Banana for instant results.")
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
        session_id = f"gen-{uuid.uuid4()}"
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id,
                       system_message="You are an expert AI image generator. Create stunning, detailed visuals.")
        chat.with_model("gemini", model["engine"]).with_params(modalities=["image", "text"])
        full_prompt = f"{req.prompt}. Aspect ratio: {req.aspect_ratio}. High quality, detailed."
        text, images = await chat.send_message_multimodal_response(UserMessage(text=full_prompt))

        if not images:
            # refund
            await db.users.update_one({"id": user["id"]}, {"$inc": {"credits": cost}})
            raise HTTPException(500, "No image generated. Try a different prompt.")

        img = images[0]
        ext = "png"
        if "jpeg" in img.get("mime_type", ""):
            ext = "jpg"
        gen_id = str(uuid.uuid4())
        filename = f"{gen_id}.{ext}"
        filepath = GENERATED_DIR / filename
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(img["data"]))

        # Build public URL via the same request host (production-safe)
        base = str(request.base_url).rstrip("/")
        media_url = f"{base}/api/media/{filename}"

        gen_doc = {
            "id": gen_id,
            "user_id": user["id"],
            "prompt": req.prompt,
            "model_id": req.model_id,
            "model_name": model["name"],
            "type": model["type"],
            "media_url": media_url,
            "filename": filename,
            "aspect_ratio": req.aspect_ratio,
            "credits_used": cost,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.generations.insert_one(gen_doc)
        gen_doc.pop("_id", None)
        new_credits = user["credits"] - cost
        return {"generation": gen_doc, "credits_remaining": new_credits}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Generation failed")
        await db.users.update_one({"id": user["id"]}, {"$inc": {"credits": cost}})
        raise HTTPException(500, f"Generation failed: {str(e)[:200]}")

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

    metadata = {
        "user_id": user["id"],
        "package_id": req.package_id,
        "credits": str(pkg["credits"]),
    }
    creq = CheckoutSessionRequest(
        amount=float(pkg["amount"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe.create_checkout_session(creq)

    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user["id"],
        "package_id": req.package_id,
        "amount": pkg["amount"],
        "currency": pkg["currency"],
        "credits": pkg["credits"],
        "payment_status": "initiated",
        "status": "pending",
        "credited": False,
        "metadata": metadata,
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
    if status.payment_status == "paid" and not txn.get("credited"):
        update["credited"] = True
        await db.users.update_one({"id": txn["user_id"]}, {"$inc": {"credits": txn["credits"]}})
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    return {
        "payment_status": status.payment_status,
        "status": status.status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "credits_added": txn["credits"] if (status.payment_status == "paid" and not txn.get("credited")) else 0,
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

# --- Stats (community) ---
@api.get("/explore")
async def explore():
    docs = await db.generations.find({}, {"_id": 0, "user_id": 0, "filename": 0}).sort("created_at", -1).limit(24).to_list(24)
    return {"generations": docs}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()

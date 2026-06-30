"""Model catalog with workflow builders for Comfy Cloud partner nodes
and Gemini (Nano Banana) via Emergent LLM key.

Each entry has:
  id          - public model id used by frontend
  name        - display name
  type        - 'image' | 'video'
  category    - tag
  credits     - cost per generation (deducted from user's Maraya balance)
  available   - shown as live in UI
  engine_type - 'gemini' or 'comfy'
  For gemini: engine = model name passed to LlmChat
  For comfy : node_class + base inputs dict; the prompt is injected at runtime
"""
from copy import deepcopy
from typing import Any


def _img_save_node(src_node_id: str = "1") -> dict:
    return {
        "class_type": "SaveImage",
        "inputs": {"images": [src_node_id, 0], "filename_prefix": "maraya"},
    }


def _vid_save_node(src_node_id: str = "1") -> dict:
    return {
        "class_type": "SaveVideo",
        "inputs": {
            "video": [src_node_id, 0],
            "filename_prefix": "maraya",
            "format": "mp4",
            "codec": "h264",
        },
    }


def build_comfy_workflow(model: dict, prompt: str, aspect_ratio: str = "16:9") -> dict:
    """Return a 2-node Comfy workflow: partner-node -> Save."""
    inputs = deepcopy(model.get("inputs") or {})
    # Most nodes use "prompt"; Hailuo uses "prompt_text".
    if model["node_class"] == "MinimaxHailuoVideoNode":
        inputs["prompt_text"] = prompt
    else:
        inputs["prompt"] = prompt
    # Overwrite aspect ratio if the node accepts it.
    if "aspect_ratio" in inputs and aspect_ratio:
        inputs["aspect_ratio"] = aspect_ratio
    workflow = {"1": {"class_type": model["node_class"], "inputs": inputs}}
    workflow["2"] = _img_save_node("1") if model["type"] == "image" else _vid_save_node("1")
    return workflow


# ----------------------------- CATALOG ----------------------------------------
MODELS: list[dict[str, Any]] = [
    # ---------------- IMAGE - Gemini (Emergent) ----------------
    {
        "id": "nano-banana", "name": "Nano Banana", "type": "image",
        "category": "Artistic", "credits": 1, "available": True,
        "tagline": "Fast, vivid Gemini image gen",
        "engine_type": "gemini", "engine": "gemini-3.1-flash-image-preview",
    },
    {
        "id": "nano-banana-pro", "name": "Nano Banana Pro", "type": "image",
        "category": "Hyper-Realistic", "credits": 2, "available": True,
        "tagline": "Premium Gemini image model",
        "engine_type": "gemini", "engine": "gemini-3-pro-image-preview",
    },

    # ---------------- IMAGE - Comfy partner nodes ----------------
    {
        "id": "flux-pro-ultra", "name": "FLUX 1.1 Pro Ultra", "type": "image",
        "category": "Cinematic", "credits": 4, "available": True,
        "tagline": "Black Forest Labs flagship",
        "engine_type": "comfy",
        "node_class": "FluxProUltraImageNode",
        "inputs": {
            "prompt_upsampling": False, "seed": 0, "aspect_ratio": "1:1",
            "raw": False, "image_prompt_strength": 0.4,
        },
    },
    {
        "id": "flux-pro", "name": "FLUX 1.1 Pro", "type": "image",
        "category": "Cinematic", "credits": 3, "available": True,
        "tagline": "Speedy FLUX Pro image gen",
        "engine_type": "comfy",
        "node_class": "FluxProImageNode",
        "inputs": {
            "prompt_upsampling": False, "seed": 0, "aspect_ratio": "1:1",
            "width": 1024, "height": 1024, "safety_tolerance": 2, "output_format": "png",
        },
    },
    {
        "id": "recraft-v3", "name": "Recraft V3", "type": "image",
        "category": "Brand & Design", "credits": 3, "available": True,
        "tagline": "Pro design + typography",
        "engine_type": "comfy",
        "node_class": "RecraftImageNode",
        "inputs": {
            "seed": 0, "size": "1024x1024",
            "style": "realistic_image", "negative_prompt": "",
        },
    },

    # ---------------- VIDEO - Comfy partner nodes ----------------
    {
        "id": "seedance-pro", "name": "Seedance Pro", "type": "video",
        "category": "Cinematic", "credits": 8, "available": True,
        "tagline": "ByteDance higher quality · 720p · 5s",
        "engine_type": "comfy",
        "node_class": "ByteDanceTextToVideoNode",
        "inputs": {
            "model": "seedance-1-5-pro-251215", "resolution": "720p",
            "aspect_ratio": "16:9", "duration": 5, "seed": 0,
            "camera_fixed": False, "watermark": False, "generate_audio": False,
        },
    },
    {
        "id": "seedance-fast", "name": "Seedance Fast", "type": "video",
        "category": "Animation", "credits": 6, "available": True,
        "tagline": "ByteDance 480p · 5s",
        "engine_type": "comfy",
        "node_class": "ByteDanceTextToVideoNode",
        "inputs": {
            "model": "seedance-1-0-pro-fast-251015", "resolution": "480p",
            "aspect_ratio": "16:9", "duration": 5, "seed": 0,
            "camera_fixed": False, "watermark": False, "generate_audio": False,
        },
    },
    {
        "id": "kling", "name": "Kling 3 Omni", "type": "video",
        "category": "Action", "credits": 9, "available": True,
        "tagline": "Kling text-to-video · 720p · 5s",
        "engine_type": "comfy",
        "node_class": "KlingOmniProTextToVideoNode",
        "inputs": {
            "model_name": "kling-v3-omni", "aspect_ratio": "16:9",
            "duration": 5, "resolution": "720p", "generate_audio": False, "seed": 0,
        },
    },
    {
        "id": "veo-3", "name": "Veo 3.1 Fast", "type": "video",
        "category": "High-Fidelity", "credits": 11, "available": True,
        "tagline": "Google Veo 3.1 · 720p · 8s",
        "engine_type": "comfy",
        "node_class": "Veo3VideoGenerationNode",
        "inputs": {
            "aspect_ratio": "16:9", "resolution": "720p", "negative_prompt": "",
            "duration_seconds": 8, "enhance_prompt": True,
            "person_generation": "ALLOW", "seed": 0,
            "model": "veo-3.1-fast-generate", "generate_audio": False,
        },
    },
    {
        "id": "grok-imagine", "name": "Grok Imagine", "type": "video",
        "category": "Unrestricted", "credits": 7, "available": True,
        "tagline": "xAI Grok Imagine · 720p · 5s",
        "engine_type": "comfy",
        "node_class": "GrokVideoNode",
        "inputs": {
            "model": "grok-imagine-video", "resolution": "720p",
            "aspect_ratio": "16:9", "duration": 5, "seed": 0,
        },
    },
    {
        "id": "luma-ray", "name": "Luma Ray Flash", "type": "video",
        "category": "Surreal", "credits": 6, "available": True,
        "tagline": "Luma text-to-video · 540p · 5s",
        "engine_type": "comfy",
        "node_class": "LumaVideoNode",
        "inputs": {
            "model": "ray-flash-2", "aspect_ratio": "16:9",
            "resolution": "540p", "duration": "5s", "loop": False, "seed": 0,
        },
    },
    {
        "id": "pixverse", "name": "PixVerse", "type": "video",
        "category": "Experimental", "credits": 5, "available": True,
        "tagline": "PixVerse text-to-video · 540p · 5s",
        "engine_type": "comfy",
        "node_class": "PixverseTextToVideoNode",
        "inputs": {
            "aspect_ratio": "16:9", "quality": "540p", "duration_seconds": 5,
            "motion_mode": "normal", "seed": 0, "negative_prompt": "",
        },
    },
    {
        "id": "hailuo", "name": "MiniMax Hailuo", "type": "video",
        "category": "Cinematic", "credits": 7, "available": True,
        "tagline": "MiniMax Hailuo · 768p · 6s",
        "engine_type": "comfy",
        "node_class": "MinimaxHailuoVideoNode",
        "inputs": {
            "seed": 0, "prompt_optimizer": True, "duration": 6, "resolution": "768P",
        },
    },
]


def public_catalog() -> list[dict]:
    """Return a sanitised catalog (no internal engine fields)."""
    keys = ("id", "name", "type", "category", "credits", "available", "tagline")
    return [{k: m[k] for k in keys} for m in MODELS]


def find_model(model_id: str) -> dict | None:
    return next((m for m in MODELS if m["id"] == model_id), None)

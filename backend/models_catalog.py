"""Model catalog for Maraya AI.

Models dispatch to one of two engines:
  - gemini : via Emergent LLM key (LlmChat)
  - comfy  : via cloud.comfy.org partner nodes

Each comfy model entry declares:
  node_class        - partner node identifier (verified from /api/object_info)
  base_inputs       - static defaults
  prompt_field      - which input receives the user prompt (default: 'prompt')
  aspect_field      - which input receives aspect ratio (default: 'aspect_ratio',
                      set to None to ignore aspect)
  size_map          - optional dict mapping ar -> a width-x-height string
                      (used when node expects a 'size' instead of aspect)
  output_kind       - 'image' or 'video' (Save node)
"""
from copy import deepcopy
from typing import Any

# Standard set of aspect ratios surfaced in the UI.
ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4"]

# Sora 2 uses a literal pixel size string.
SORA_SIZE_MAP = {
    "1:1": "1280x720",
    "16:9": "1280x720",
    "9:16": "720x1280",
    "4:3": "1024x1792",
    "3:4": "1024x1792",
}


def _save_image(src: str = "1") -> dict:
    return {"class_type": "SaveImage",
            "inputs": {"images": [src, 0], "filename_prefix": "maraya"}}


def _save_video(src: str = "1") -> dict:
    return {"class_type": "SaveVideo",
            "inputs": {"video": [src, 0], "filename_prefix": "maraya",
                       "format": "mp4", "codec": "h264"}}


def build_comfy_workflow(model: dict, prompt: str, aspect_ratio: str = "16:9") -> dict:
    inputs: dict[str, Any] = deepcopy(model.get("base_inputs") or {})
    prompt_field = model.get("prompt_field", "prompt")
    inputs[prompt_field] = prompt

    if model.get("size_map") and aspect_ratio:
        inputs["size"] = model["size_map"].get(aspect_ratio, list(model["size_map"].values())[0])
    else:
        aspect_field = model.get("aspect_field", "aspect_ratio")
        if aspect_field and aspect_ratio:
            # Only set if node declares this field
            if aspect_field in inputs or "aspect_ratio" in (model.get("base_inputs") or {}):
                inputs[aspect_field] = aspect_ratio

    wf: dict[str, Any] = {"1": {"class_type": model["node_class"], "inputs": inputs}}
    wf["2"] = _save_image("1") if model.get("output_kind", model["type"]) == "image" else _save_video("1")
    return wf


# ============================ CATALOG ========================================
MODELS: list[dict[str, Any]] = [
    # --------------------------- IMAGE / Comfy ----------------------------
    {"id": "flux-1.1-ultra", "name": "FLUX 1.1 Ultra", "type": "image",
     "category": "Cinematic", "credits": 4, "available": True,
     "tagline": "Black Forest Labs flagship · maximum quality",
     "engine_type": "comfy", "node_class": "FluxProUltraImageNode",
     "base_inputs": {"prompt_upsampling": False, "seed": 0, "aspect_ratio": "1:1",
                     "raw": False, "image_prompt_strength": 0.4}},
    {"id": "flux-kontext-pro", "name": "FLUX Kontext Pro", "type": "image",
     "category": "Editorial", "credits": 3, "available": True,
     "tagline": "FLUX with input-image control",
     "engine_type": "comfy", "node_class": "FluxKontextProImageNode",
     "base_inputs": {"aspect_ratio": "1:1", "guidance": 3.5, "steps": 30,
                     "seed": 0, "prompt_upsampling": False}},
    {"id": "flux-kontext-max", "name": "FLUX Kontext Max", "type": "image",
     "category": "Editorial", "credits": 4, "available": True,
     "tagline": "Highest-fidelity FLUX Kontext",
     "engine_type": "comfy", "node_class": "FluxKontextMaxImageNode",
     "base_inputs": {"aspect_ratio": "1:1", "guidance": 3.5, "steps": 40,
                     "seed": 0, "prompt_upsampling": False}},
    {"id": "flux-2-pro", "name": "FLUX 2 Pro", "type": "image",
     "category": "Cinematic", "credits": 4, "available": True,
     "tagline": "Next-gen FLUX 2 image",
     "engine_type": "comfy", "node_class": "Flux2ProImageNode",
     "base_inputs": {"width": 1024, "height": 1024, "seed": 0, "prompt_upsampling": False},
     "aspect_field": None},
    {"id": "gpt-image-1", "name": "GPT Image 1", "type": "image",
     "category": "Realistic", "credits": 3, "available": True,
     "tagline": "OpenAI's flagship image model",
     "engine_type": "comfy", "node_class": "OpenAIGPTImage1",
     "base_inputs": {"seed": 0, "quality": "high", "background": "auto",
                     "size": "1024x1024", "n": 1},
     "aspect_field": None},
    {"id": "ideogram-v4", "name": "Ideogram V4", "type": "image",
     "category": "Typography", "credits": 3, "available": True,
     "tagline": "Best-in-class text-in-image",
     "engine_type": "comfy", "node_class": "IdeogramV4",
     "base_inputs": {"resolution": "Auto", "rendering_speed": "DEFAULT", "seed": 0},
     "aspect_field": None},
    {"id": "recraft-v4", "name": "Recraft V4", "type": "image",
     "category": "Brand & Design", "credits": 3, "available": True,
     "tagline": "Pro design, typography & vectors",
     "engine_type": "comfy", "node_class": "RecraftV4TextToImageNode",
     "base_inputs": {"negative_prompt": "", "model": "recraftv3", "n": 1, "seed": 0},
     "aspect_field": None},
    {"id": "seedream-v2", "name": "Seedream 2", "type": "image",
     "category": "Artistic", "credits": 3, "available": True,
     "tagline": "ByteDance Seedream image model",
     "engine_type": "comfy", "node_class": "ByteDanceSeedreamNodeV2",
     "base_inputs": {"model": "seedream-3-0-t2i-250415", "seed": 0, "watermark": False},
     "aspect_field": None},
    {"id": "grok-image", "name": "Grok Imagine Image", "type": "image",
     "category": "Unrestricted", "credits": 3, "available": True,
     "tagline": "xAI Grok image generation",
     "engine_type": "comfy", "node_class": "GrokImageNode",
     "base_inputs": {"model": "grok-imagine-image-pro", "aspect_ratio": "1:1",
                     "number_of_images": 1, "seed": 0, "resolution": "2K"}},
    {"id": "stability-ultra", "name": "Stable Image Ultra", "type": "image",
     "category": "Photographic", "credits": 3, "available": True,
     "tagline": "Stability AI flagship",
     "engine_type": "comfy", "node_class": "StabilityStableImageUltraNode",
     "base_inputs": {"aspect_ratio": "1:1", "style_preset": "photographic", "seed": 0}},

    # --------------------------- VIDEO / Comfy ----------------------------
    {"id": "sora-2", "name": "Sora 2", "type": "video", "category": "Cinematic",
     "credits": 12, "available": True, "tagline": "OpenAI cinematic video · 8s",
     "engine_type": "comfy", "node_class": "OpenAIVideoSora2",
     "base_inputs": {"model": "sora-2", "duration": 8, "seed": 0},
     "size_map": SORA_SIZE_MAP},
    {"id": "sora-2-pro", "name": "Sora 2 Pro", "type": "video", "category": "Cinematic",
     "credits": 18, "available": True, "tagline": "Premium realistic Sora · 8s",
     "engine_type": "comfy", "node_class": "OpenAIVideoSora2",
     "base_inputs": {"model": "sora-2-pro", "duration": 8, "seed": 0},
     "size_map": SORA_SIZE_MAP},
    {"id": "veo-3.1-fast", "name": "Veo 3.1 Fast", "type": "video",
     "category": "High-Fidelity", "credits": 11, "available": True,
     "tagline": "Google Veo 3.1 · 720p · 8s",
     "engine_type": "comfy", "node_class": "Veo3VideoGenerationNode",
     "base_inputs": {"aspect_ratio": "16:9", "resolution": "720p", "negative_prompt": "",
                     "duration_seconds": 8, "enhance_prompt": True,
                     "person_generation": "ALLOW", "seed": 0,
                     "model": "veo-3.1-fast-generate", "generate_audio": False}},
    {"id": "veo-2", "name": "Veo 2", "type": "video", "category": "High-Fidelity",
     "credits": 9, "available": True, "tagline": "Google Veo 2 · 720p · 5-8s",
     "engine_type": "comfy", "node_class": "VeoVideoGenerationNode",
     "base_inputs": {"aspect_ratio": "16:9", "negative_prompt": "", "duration_seconds": 5,
                     "enhance_prompt": True, "person_generation": "ALLOW", "seed": 0}},
    {"id": "kling-omni", "name": "Kling 3 Omni", "type": "video",
     "category": "Action", "credits": 9, "available": True,
     "tagline": "Kling Omni Pro · 720p · 5s",
     "engine_type": "comfy", "node_class": "KlingOmniProTextToVideoNode",
     "base_inputs": {"model_name": "kling-v3-omni", "aspect_ratio": "16:9",
                     "duration": 5, "resolution": "720p",
                     "generate_audio": False, "seed": 0}},
    {"id": "kling-v2.5-turbo", "name": "Kling 2.5 Turbo", "type": "video",
     "category": "Cinematic", "credits": 8, "available": True,
     "tagline": "Kling v2.5 turbo · pro mode · 5s",
     "engine_type": "comfy", "node_class": "KlingTextToVideoNode",
     "base_inputs": {"negative_prompt": "", "cfg_scale": 0.5, "aspect_ratio": "16:9",
                     "mode": "pro mode / 5s duration / kling-v2-5-turbo"}},
    {"id": "seedance-pro", "name": "Seedance Pro", "type": "video",
     "category": "Cinematic", "credits": 8, "available": True,
     "tagline": "ByteDance Seedance 1.5 · 720p · 5s",
     "engine_type": "comfy", "node_class": "ByteDanceTextToVideoNode",
     "base_inputs": {"model": "seedance-1-5-pro-251215", "resolution": "720p",
                     "aspect_ratio": "16:9", "duration": 5, "seed": 0,
                     "camera_fixed": False, "watermark": False, "generate_audio": False}},
    {"id": "seedance-fast", "name": "Seedance Fast", "type": "video",
     "category": "Animation", "credits": 6, "available": True,
     "tagline": "ByteDance · 480p · 5s",
     "engine_type": "comfy", "node_class": "ByteDanceTextToVideoNode",
     "base_inputs": {"model": "seedance-1-0-pro-fast-251015", "resolution": "480p",
                     "aspect_ratio": "16:9", "duration": 5, "seed": 0,
                     "camera_fixed": False, "watermark": False, "generate_audio": False}},
    {"id": "grok-video", "name": "Grok Imagine Video", "type": "video",
     "category": "Unrestricted", "credits": 7, "available": True,
     "tagline": "xAI Grok Imagine · 720p · 5s",
     "engine_type": "comfy", "node_class": "GrokVideoNode",
     "base_inputs": {"model": "grok-imagine-video", "resolution": "720p",
                     "aspect_ratio": "16:9", "duration": 5, "seed": 0}},
    {"id": "happyhorse", "name": "HappyHorse 1.0", "type": "video",
     "category": "Experimental", "credits": 6, "available": True,
     "tagline": "HappyHorse audio-video",
     "engine_type": "comfy", "node_class": "HappyHorseTextToVideoApi",
     "base_inputs": {"model": "happyhorse-1-0", "seed": 0, "watermark": False},
     "aspect_field": None, "prompt_field": "prompt"},
    {"id": "luma-ray-3.2", "name": "Luma Ray Flash 2", "type": "video",
     "category": "Surreal", "credits": 6, "available": True,
     "tagline": "Luma Ray · 720p · 5s",
     "engine_type": "comfy", "node_class": "LumaRay32TextToVideoNode",
     "base_inputs": {"aspect_ratio": "16:9", "resolution": "720p",
                     "duration": "5s", "loop": False, "seed": 0}},
    {"id": "pixverse", "name": "PixVerse", "type": "video", "category": "Experimental",
     "credits": 5, "available": True, "tagline": "PixVerse · 540p · 5s",
     "engine_type": "comfy", "node_class": "PixverseTextToVideoNode",
     "base_inputs": {"aspect_ratio": "16:9", "quality": "540p", "duration_seconds": 5,
                     "motion_mode": "normal", "seed": 0, "negative_prompt": ""}},
    {"id": "hailuo", "name": "MiniMax Hailuo", "type": "video", "category": "Cinematic",
     "credits": 7, "available": True, "tagline": "MiniMax Hailuo · 768p · 6s",
     "engine_type": "comfy", "node_class": "MinimaxHailuoVideoNode",
     "base_inputs": {"seed": 0, "prompt_optimizer": True, "duration": 6, "resolution": "768P"},
     "prompt_field": "prompt_text", "aspect_field": None},
    {"id": "minimax-base", "name": "MiniMax T2V", "type": "video", "category": "Animation",
     "credits": 5, "available": True, "tagline": "MiniMax base text-to-video",
     "engine_type": "comfy", "node_class": "MinimaxTextToVideoNode",
     "base_inputs": {"model": "MiniMax-Hailuo-02", "seed": 0},
     "prompt_field": "prompt_text", "aspect_field": None},
]


def public_catalog() -> list[dict]:
    keys = ("id", "name", "type", "category", "credits", "available", "tagline")
    return [{k: m[k] for k in keys} for m in MODELS]


def find_model(model_id: str) -> dict | None:
    return next((m for m in MODELS if m["id"] == model_id), None)

"""Vercel Python Function entrypoint.

Vercel's Python runtime executes this file with the project's *repo root* as
the working directory (not this file's own directory), but __file__ still
resolves correctly, so we use it to locate the real backend/ folder and add
it to sys.path. backend/server.py uses flat, non-package imports internally
(`import models_catalog`, `import comfy_cloud_client`) so it can still be run
directly with `uvicorn server:app` from inside backend/ for local dev or the
VPS/Docker path in deploy/ - this shim makes the same file importable from
Vercel's function root without changing those internal imports.
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from server import app  # noqa: E402  (must come after sys.path insert)

__all__ = ["app"]

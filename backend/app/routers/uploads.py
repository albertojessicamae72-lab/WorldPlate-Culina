import re
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
MAX_SIZE = 5 * 1024 * 1024


def _sanitize(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", name or "").strip("-_") or "image"


@router.post("", status_code=201)
async def upload_image(file: UploadFile):
    ext = ALLOWED_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload a JPEG, PNG, GIF, or WebP image.",
        )
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")
    filename = f"{uuid.uuid4().hex}-{_sanitize(file.filename or '')}"
    if not filename.lower().endswith(ext):
        filename += ext
    (UPLOAD_DIR / filename).write_bytes(data)
    return {"url": f"/api/uploads/{filename}"}

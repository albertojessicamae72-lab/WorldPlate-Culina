from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .routers import adaptations, interactions, recipes, uploads

app = FastAPI(title="LocalPlate API", version="0.1.0")

app.include_router(recipes.router)
app.include_router(adaptations.router)
app.include_router(interactions.router)
app.include_router(uploads.router)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}

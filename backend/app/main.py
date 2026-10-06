from pathlib import Path
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import account_store
from .routers import accounts, adaptations, interactions, local_twists, recipes, uploads

logger = logging.getLogger(__name__)


async def _avatar_cleanup_loop():
    while True:
        await asyncio.sleep(24 * 60 * 60)
        try:
            await asyncio.to_thread(account_store.cleanup_expired_avatars)
        except Exception:
            logger.exception("Scheduled profile photo cleanup failed")


async def _ephemeral_message_cleanup_loop():
    while True:
        await asyncio.sleep(60)
        account_store.cleanup_ephemeral_messages()


@asynccontextmanager
async def lifespan(_app):
    try:
        await asyncio.to_thread(account_store.cleanup_expired_avatars)
    except Exception:
        logger.exception("Initial profile photo cleanup failed")
    cleanup_task = asyncio.create_task(_avatar_cleanup_loop())
    message_cleanup_task = asyncio.create_task(_ephemeral_message_cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        message_cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
        try:
            await message_cleanup_task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Culina API", version="0.1.0", lifespan=lifespan)

app.include_router(recipes.router)
app.include_router(accounts.router)
app.include_router(adaptations.router)
app.include_router(interactions.router)
app.include_router(local_twists.router)
app.include_router(uploads.router)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}

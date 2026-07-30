import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .cache import cached_json
from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .seed import ensure_seeded

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_seeded()
    yield

app = FastAPI(title="Search Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "search-service"}

@app.get("/trends")
async def trends():

    async def compute():
        docs = await db.trends.find({}).to_list(length=None)
        return [serialize(d) for d in docs]

    return await cached_json("trends", ttl_seconds=30, compute=compute)

@app.get("/search")
async def search(q: str = ""):
    if not q.strip():
        return {"users": [], "posts": []}

    rx = {"$regex": re.escape(q), "$options": "i"}
    filt = {"$or": [{"text": rx}, {"name": rx}, {"handle": rx}]}
    docs = await db.searchIndex.find(filt).to_list(length=None)
    matches = [serialize(d) for d in docs]
    return {
        "users": [m for m in matches if m["type"] == "user"],
        "posts": [m for m in matches if m["type"] == "post"],
    }

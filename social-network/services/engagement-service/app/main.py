from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING

from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .models import ToggleRequest

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.engagement.create_index(
        [("userHandle", ASCENDING), ("postId", ASCENDING), ("type", ASCENDING)], unique=True
    )
    yield

app = FastAPI(title="Engagement Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "engagement-service"}

@app.get("/engagement/state")
async def state(userHandle: str, postIds: str):
    ids = [i.strip() for i in postIds.split(",") if i.strip()]
    matches = await db.engagement.find(
        {"userHandle": userHandle, "postId": {"$in": ids}}
    ).to_list(length=None)

    def has(post_id: str, type_: str) -> bool:
        return any(m["postId"] == post_id and m["type"] == type_ for m in matches)

    return {
        post_id: {
            "liked": has(post_id, "like"),
            "reposted": has(post_id, "repost"),
            "bookmarked": has(post_id, "bookmark"),
        }
        for post_id in ids
    }

@app.get("/engagement/bookmarks")
async def bookmarks(userHandle: str):
    docs = await db.engagement.find(
        {"userHandle": userHandle, "type": "bookmark"}
    ).sort("createdAt", -1).to_list(length=None)
    return [d["postId"] for d in docs]

@app.get("/engagement/likes")
async def likes(userHandle: str):
    docs = await db.engagement.find(
        {"userHandle": userHandle, "type": "like"}
    ).sort("createdAt", -1).to_list(length=None)
    return [d["postId"] for d in docs]

@app.post("/engagement/toggle")
async def toggle(req: ToggleRequest):
    filt = {"userHandle": req.userHandle, "postId": req.postId, "type": req.type}
    existing = await db.engagement.find_one(filt)

    if existing is not None:
        await db.engagement.delete_one(filt)
        return {"active": False}

    await db.engagement.insert_one({**filt, "createdAt": datetime.now(timezone.utc)})
    return {"active": True}

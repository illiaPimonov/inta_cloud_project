import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from .cache import cached_json, invalidate_prefix, stats
from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .models import CounterUpdateRequest, CreatePostRequest
from .seed import ensure_seeded

POSTS_LIST_CACHE_PREFIX = "posts:list:"
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "8"))

def valid_object_id(id_: str) -> bool:
    try:
        ObjectId(id_)
        return True
    except (InvalidId, TypeError):
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_seeded()
    yield

app = FastAPI(title="Posts Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "posts-service"}

@app.get("/posts")
async def list_posts(
    authorHandle: Optional[str] = None,
    query: Optional[str] = None,
    ids: Optional[str] = None,
    type: Optional[str] = None,
    media: Optional[bool] = None,
):

    if ids and ids.strip():

        id_list = [i.strip() for i in ids.split(",") if i.strip() and valid_object_id(i.strip())]
        docs = await db.posts.find({"_id": {"$in": [ObjectId(i) for i in id_list]}}).to_list(length=None)
        return [serialize(d) for d in docs]

    async def compute():
        type_lower = (type or "").lower()
        if type_lower == "replies":
            filt: dict = {"replyToPostId": {"$ne": None}}
        elif type_lower == "all":
            filt = {}
        else:
            filt = {"replyToPostId": None}

        if authorHandle and authorHandle.strip():
            filt["authorHandle"] = authorHandle

        if media is True:
            filt["hasMedia"] = True

        if query and query.strip():
            filt["text"] = {"$regex": re.escape(query), "$options": "i"}

        docs = await db.posts.find(filt).sort("createdAt", -1).to_list(length=None)
        return [serialize(d) for d in docs]

    cache_key = f"{POSTS_LIST_CACHE_PREFIX}{authorHandle or '-'}:{query or '-'}:{type or '-'}:{media}"
    return await cached_json(cache_key, ttl_seconds=CACHE_TTL_SECONDS, compute=compute)

@app.get("/debug/cache-stats")
async def cache_stats():
    return {
        "cacheTtlSeconds": CACHE_TTL_SECONDS,
        "totalRequests": stats["totalRequests"],
        "mongoReads": stats["mongoReads"],
    }

@app.get("/posts/{id}")
async def get_post(id: str):
    if not valid_object_id(id):
        raise HTTPException(404)
    doc = await db.posts.find_one({"_id": ObjectId(id)})
    if doc is None:
        raise HTTPException(404)
    return serialize(doc)

@app.get("/posts/{id}/replies")
async def get_replies(id: str):
    if not valid_object_id(id):
        return []
    docs = await db.posts.find({"replyToPostId": id}).sort("createdAt", 1).to_list(length=None)
    return [serialize(d) for d in docs]

@app.post("/posts", status_code=201)
async def create_post(req: CreatePostRequest):
    post = {
        "authorHandle": req.authorHandle,
        "authorName": req.authorName,
        "text": req.text,
        "createdAt": datetime.now(timezone.utc),
        "timestamp": "now",
        "hasMedia": req.hasMedia,
        "mediaHeight": 220 if req.hasMedia else None,
        "replyToPostId": None,
        "stats": {"replies": 0, "reposts": 0, "likes": 0},
    }
    result = await db.posts.insert_one(post)
    post["_id"] = result.inserted_id
    await invalidate_prefix(POSTS_LIST_CACHE_PREFIX)
    return serialize(post)

@app.post("/posts/{id}/replies", status_code=201)
async def create_reply(id: str, req: CreatePostRequest):
    if not valid_object_id(id):
        raise HTTPException(404)
    parent = await db.posts.find_one({"_id": ObjectId(id)})
    if parent is None:
        raise HTTPException(404)

    reply = {
        "authorHandle": req.authorHandle,
        "authorName": req.authorName,
        "text": req.text,
        "createdAt": datetime.now(timezone.utc),
        "timestamp": "now",
        "hasMedia": req.hasMedia,
        "mediaHeight": 220 if req.hasMedia else None,
        "replyToPostId": id,
        "stats": {"replies": 0, "reposts": 0, "likes": 0},
    }
    result = await db.posts.insert_one(reply)
    reply["_id"] = result.inserted_id
    await db.posts.update_one({"_id": ObjectId(id)}, {"$inc": {"stats.replies": 1}})
    await invalidate_prefix(POSTS_LIST_CACHE_PREFIX)
    return serialize(reply)

@app.patch("/posts/{id}/counters")
async def update_counters(id: str, req: CounterUpdateRequest):
    if not valid_object_id(id):
        raise HTTPException(404)

    field = req.field.lower()
    if field not in ("likes", "reposts", "replies"):
        raise HTTPException(400, detail={"message": "field must be likes, reposts, or replies"})

    result = await db.posts.update_one({"_id": ObjectId(id)}, {"$inc": {f"stats.{field}": req.delta}})
    if result.matched_count == 0:
        raise HTTPException(404)

    return {"id": id, "field": req.field, "delta": req.delta}

@app.delete("/posts/{id}", status_code=204)
async def delete_post(id: str, authorHandle: str):
    if not valid_object_id(id):
        raise HTTPException(404)

    post = await db.posts.find_one({"_id": ObjectId(id)})
    if post is None:
        raise HTTPException(404)
    if post["authorHandle"] != authorHandle:
        raise HTTPException(403, detail={"message": "You can only delete your own posts"})

    await db.posts.delete_one({"_id": ObjectId(id)})
    await invalidate_prefix(POSTS_LIST_CACHE_PREFIX)

    return Response(status_code=204)

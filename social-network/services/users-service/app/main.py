import re
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING

from .cache import cached_json
from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .models import FollowToggleRequest, LoginRequest, RegisterRequest, UpdateProfileRequest
from .seed import ensure_seeded

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_seeded()
    await db.follows.create_index(
        [("viewerHandle", ASCENDING), ("targetHandle", ASCENDING)], unique=True
    )
    yield

app = FastAPI(title="Users Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "users-service"}

@app.get("/users")
async def list_users(exclude: Optional[str] = None, query: Optional[str] = None):
    filt: dict = {"isActive": True}
    if exclude:
        filt["handle"] = {"$ne": exclude}
    if query:
        rx = {"$regex": re.escape(query), "$options": "i"}
        filt["$or"] = [{"name": rx}, {"handle": rx}, {"bio": rx}]
    docs = await db.users.find(filt).to_list(length=None)
    return [serialize(d) for d in docs]

@app.get("/users/suggestions")
async def suggestions(exclude: Optional[str] = None, limit: int = 4):
    limit = limit if limit and limit > 0 else 4

    async def compute():
        filt: dict = {"isSuggested": True, "isActive": True}
        if exclude:
            filt["handle"] = {"$ne": exclude}
        docs = await db.users.find(filt).limit(limit).to_list(length=None)
        return [serialize(d) for d in docs]

    key = f"users:suggestions:{exclude or '-'}:{limit}"
    return await cached_json(key, ttl_seconds=30, compute=compute)

@app.get("/users/{handle}")
async def get_user(handle: str):
    doc = await db.users.find_one({"handle": handle})
    if doc is None:
        raise HTTPException(404)
    return serialize(doc)

@app.get("/users/{handle}/follow-state")
async def follow_state(handle: str, viewerHandle: str):
    match = await db.follows.find_one({"viewerHandle": viewerHandle, "targetHandle": handle})
    return {"following": match is not None}

@app.post("/users/login")
async def login(req: LoginRequest):
    identifier = req.identifier.strip().lower()
    user = await db.users.find_one({"handle": identifier})
    if user is None:
        user = await db.users.find_one({"email": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}})

    if user is None or not user.get("isActive") or not req.password.strip():
        raise HTTPException(401, detail={"message": "Incorrect username or password"})

    return serialize(user)

@app.post("/users/register", status_code=201)
async def register(req: RegisterRequest):
    handle = req.username.strip().lower()
    existing = await db.users.find_one({"handle": handle})
    if existing is not None:
        raise HTTPException(409, detail={"message": "Username already taken"})

    user = {
        "name": req.displayName,
        "handle": handle,
        "email": req.email,
        "passwordHash": req.password,
        "bio": None,
        "location": None,
        "website": None,
        "joined": datetime.now(timezone.utc).strftime("%B %Y"),
        "followingCount": 0,
        "followersCount": 0,
        "isSuggested": False,
        "isActive": True,
    }
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return serialize(user)

@app.patch("/users/{handle}")
async def update_profile(handle: str, req: UpdateProfileRequest):
    current = await db.users.find_one({"handle": handle})
    if current is None:
        raise HTTPException(404)

    new_handle = req.username.strip().lower()
    if new_handle != handle:
        taken = await db.users.find_one({"handle": new_handle})
        if taken is not None:
            raise HTTPException(409, detail={"message": "Username already taken"})

    await db.users.update_one(
        {"handle": handle},
        {"$set": {"name": req.displayName, "handle": new_handle, "email": req.email}},
    )
    updated = await db.users.find_one({"handle": new_handle})
    return serialize(updated)

@app.post("/users/{handle}/deactivate")
async def deactivate(handle: str):
    result = await db.users.update_one({"handle": handle}, {"$set": {"isActive": False}})
    if result.matched_count == 0:
        raise HTTPException(404)
    return {"handle": handle, "isActive": False}

@app.post("/users/follow")
async def toggle_follow(req: FollowToggleRequest):
    if req.viewerHandle == req.targetHandle:
        raise HTTPException(400, detail={"message": "Can't follow yourself"})

    target = await db.users.find_one({"handle": req.targetHandle})
    if target is None:
        raise HTTPException(404)

    existing = await db.follows.find_one(
        {"viewerHandle": req.viewerHandle, "targetHandle": req.targetHandle}
    )

    if existing is not None:
        await db.follows.delete_one({"_id": existing["_id"]})
        await db.users.update_one({"handle": req.targetHandle}, {"$inc": {"followersCount": -1}})
        await db.users.update_one({"handle": req.viewerHandle}, {"$inc": {"followingCount": -1}})
        return {"following": False}

    await db.follows.insert_one(
        {
            "viewerHandle": req.viewerHandle,
            "targetHandle": req.targetHandle,
            "createdAt": datetime.now(timezone.utc),
        }
    )
    await db.users.update_one({"handle": req.targetHandle}, {"$inc": {"followersCount": 1}})
    await db.users.update_one({"handle": req.viewerHandle}, {"$inc": {"followingCount": 1}})
    return {"following": True}

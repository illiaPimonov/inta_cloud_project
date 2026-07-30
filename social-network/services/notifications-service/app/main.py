from contextlib import asynccontextmanager
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .models import CreateNotificationRequest
from .seed import ensure_seeded

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

app = FastAPI(title="Notifications Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "notifications-service"}

@app.get("/notifications")
async def list_notifications(userHandle: str):
    docs = await db.notifications.find({"recipientHandle": userHandle}).sort(
        "createdAt", -1
    ).to_list(length=None)
    return [serialize(d) for d in docs]

@app.patch("/notifications/{id}/read")
async def mark_read(id: str):
    if not valid_object_id(id):
        raise HTTPException(404)
    result = await db.notifications.update_one({"_id": ObjectId(id)}, {"$set": {"unread": False}})
    if result.matched_count == 0:
        raise HTTPException(404)
    return {"id": id, "unread": False}

@app.post("/notifications", status_code=201)
async def create_notification(req: CreateNotificationRequest):
    if req.recipientHandle == req.actorHandle:
        return {"skipped": True, "reason": "actor and recipient are the same user"}

    notification = {
        "recipientHandle": req.recipientHandle,
        "type": req.type,
        "actors": [{"name": req.actorName, "handle": req.actorHandle}],
        "extraCount": None,
        "postExcerpt": req.postExcerpt,
        "unread": True,
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.notifications.insert_one(notification)
    notification["_id"] = result.inserted_id
    return serialize(notification)

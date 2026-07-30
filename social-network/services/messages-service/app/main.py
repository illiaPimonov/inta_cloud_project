from contextlib import asynccontextmanager
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .db import db, serialize, CORS_ALLOWED_ORIGIN
from .models import SendMessageRequest, StartConversationRequest
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

app = FastAPI(title="Messages Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "messages-service"}

@app.get("/conversations")
async def list_conversations(userHandle: str):
    filt = {"$or": [{"participantAHandle": userHandle}, {"participantBHandle": userHandle}]}
    docs = await db.conversations.find(filt).sort("updatedAt", -1).to_list(length=None)

    projected = []
    for c in docs:
        is_a = c["participantAHandle"] == userHandle
        projected.append({
            "id": str(c["_id"]),
            "otherHandle": c["participantBHandle"] if is_a else c["participantAHandle"],
            "otherName": c["participantBName"] if is_a else c["participantAName"],
            "lastMessage": c["lastMessage"],
            "lastMessageFromMe": c["lastMessageFromHandle"] == userHandle,
            "unread": c.get("unreadForHandle") == userHandle,
            "updatedAt": c["updatedAt"],
        })
    return projected

@app.get("/conversations/{id}/messages")
async def get_messages(id: str, userHandle: str):
    if not valid_object_id(id):
        raise HTTPException(404)
    convo = await db.conversations.find_one({"_id": ObjectId(id)})
    if convo is None:
        raise HTTPException(404)

    if convo.get("unreadForHandle") == userHandle:
        await db.conversations.update_one({"_id": ObjectId(id)}, {"$set": {"unreadForHandle": None}})

    docs = await db.messages.find({"conversationId": id}).sort("sentAt", 1).to_list(length=None)
    return [
        {"id": str(m["_id"]), "fromMe": m["fromHandle"] == userHandle, "text": m["text"], "sentAt": m["sentAt"]}
        for m in docs
    ]

@app.post("/conversations/{id}/messages", status_code=201)
async def send_message(id: str, req: SendMessageRequest):
    if not valid_object_id(id):
        raise HTTPException(404)
    convo = await db.conversations.find_one({"_id": ObjectId(id)})
    if convo is None:
        raise HTTPException(404)

    message = {
        "conversationId": id,
        "fromHandle": req.fromHandle,
        "text": req.text,
        "sentAt": datetime.now(timezone.utc),
    }
    result = await db.messages.insert_one(message)
    message["_id"] = result.inserted_id

    recipient_handle = (
        convo["participantBHandle"] if convo["participantAHandle"] == req.fromHandle else convo["participantAHandle"]
    )
    await db.conversations.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "lastMessage": req.text,
                "lastMessageFromHandle": req.fromHandle,
                "updatedAt": datetime.now(timezone.utc),
                "unreadForHandle": recipient_handle,
            }
        },
    )
    return serialize(message)

@app.post("/conversations", status_code=201)
async def start_conversation(req: StartConversationRequest):
    filt = {
        "$or": [
            {"participantAHandle": req.initiatorHandle, "participantBHandle": req.recipientHandle},
            {"participantAHandle": req.recipientHandle, "participantBHandle": req.initiatorHandle},
        ]
    }
    existing = await db.conversations.find_one(filt)
    if existing is not None:
        return {"id": str(existing["_id"])}

    convo = {
        "participantAHandle": req.initiatorHandle,
        "participantAName": req.initiatorName,
        "participantBHandle": req.recipientHandle,
        "participantBName": req.recipientName,
        "lastMessage": "",
        "lastMessageFromHandle": req.initiatorHandle,
        "updatedAt": datetime.now(timezone.utc),
        "unreadForHandle": None,
    }
    result = await db.conversations.insert_one(convo)
    return {"id": str(result.inserted_id)}

from datetime import datetime, timedelta, timezone

from .db import acquire_seed_lock, db

async def ensure_seeded() -> None:
    count = await db.conversations.estimated_document_count()
    if count > 0:
        return
    if not await acquire_seed_lock("conversations"):
        return

    now = datetime.now(timezone.utc)

    c1 = {
        "participantAHandle": "jordankim", "participantAName": "Jordan Kim",
        "participantBHandle": "mayatorres", "participantBName": "Maya Torres",
        "lastMessage": "Sent the updated spec, take a look when you can",
        "lastMessageFromHandle": "mayatorres",
        "updatedAt": now - timedelta(minutes=2),
        "unreadForHandle": "jordankim",
    }
    c2 = {
        "participantAHandle": "jordankim", "participantAName": "Jordan Kim",
        "participantBHandle": "devpatel", "participantBName": "Dev Patel",
        "lastMessage": "sounds good, let's ship it Friday",
        "lastMessageFromHandle": "jordankim",
        "updatedAt": now - timedelta(hours=1),
        "unreadForHandle": None,
    }
    c3 = {
        "participantAHandle": "jordankim", "participantAName": "Jordan Kim",
        "participantBHandle": "alexchen", "participantBName": "Alex Chen",
        "lastMessage": "Thanks for the intro \U0001F64F",
        "lastMessageFromHandle": "alexchen",
        "updatedAt": now - timedelta(days=1),
        "unreadForHandle": None,
    }

    result = await db.conversations.insert_many([c1, c2, c3])
    c1_id, c2_id, c3_id = (str(i) for i in result.inserted_ids)

    await db.messages.insert_many([
        {"conversationId": c1_id, "fromHandle": "mayatorres",
         "text": "Hey! Just pushed the updated onboarding spec",
         "sentAt": now - timedelta(minutes=6)},
        {"conversationId": c1_id, "fromHandle": "mayatorres",
         "text": "Sent the updated spec, take a look when you can",
         "sentAt": now - timedelta(minutes=5)},
        {"conversationId": c1_id, "fromHandle": "jordankim",
         "text": "On it — reviewing now, thank you!",
         "sentAt": now - timedelta(minutes=2)},

        {"conversationId": c2_id, "fromHandle": "devpatel",
         "text": "Can we ship the new flow this week?",
         "sentAt": now - timedelta(hours=1, minutes=12)},
        {"conversationId": c2_id, "fromHandle": "jordankim",
         "text": "sounds good, let's ship it Friday",
         "sentAt": now - timedelta(hours=1)},

        {"conversationId": c3_id, "fromHandle": "alexchen",
         "text": "Thanks for the intro \U0001F64F",
         "sentAt": now - timedelta(days=1)},
    ])

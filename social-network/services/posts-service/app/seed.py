from datetime import datetime, timedelta, timezone

from .db import acquire_seed_lock, db

async def ensure_seeded() -> None:
    count = await db.posts.estimated_document_count()
    if count > 0:
        return
    if not await acquire_seed_lock("posts"):
        return

    now = datetime.now(timezone.utc)

    p1 = {
        "authorHandle": "priyanair", "authorName": "Priya Nair",
        "text": "Shipping our new onboarding flow today — huge thanks to the team. #buildinpublic",
        "createdAt": now - timedelta(hours=2), "timestamp": "2h",
        "hasMedia": True, "mediaHeight": 180, "replyToPostId": None,
        "stats": {"replies": 12, "reposts": 4, "likes": 89},
    }
    p2 = {
        "authorHandle": "devpatel", "authorName": "Dev Patel",
        "text": "Hot take: infinite scroll beats pagination for social feeds every time. "
                "Numbered pages feel dated next to a continuous timeline.",
        "createdAt": now - timedelta(hours=4), "timestamp": "4h",
        "hasMedia": False, "mediaHeight": None, "replyToPostId": None,
        "stats": {"replies": 30, "reposts": 8, "likes": 210},
    }
    p3 = {
        "authorHandle": "mayatorres", "authorName": "Maya Torres",
        "text": "Our new design systems doc is live — covers tokens, components, and "
                "contribution guidelines.",
        "createdAt": now - timedelta(days=1), "timestamp": "1d",
        "hasMedia": True, "mediaHeight": 180, "replyToPostId": None,
        "stats": {"replies": 6, "reposts": 2, "likes": 54},
    }

    result = await db.posts.insert_many([p1, p2, p3])
    p2_id = result.inserted_ids[1]

    reply = {
        "authorHandle": "priyanair", "authorName": "Priya Nair",
        "text": "Agreed, and it keeps scroll position intact too.",
        "createdAt": now - timedelta(hours=1), "timestamp": "1h",
        "hasMedia": False, "mediaHeight": None, "replyToPostId": str(p2_id),
        "stats": {"replies": 0, "reposts": 0, "likes": 3},
    }
    await db.posts.insert_one(reply)

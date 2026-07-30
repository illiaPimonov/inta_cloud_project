from datetime import datetime, timedelta, timezone

from .db import acquire_seed_lock, db

async def ensure_seeded() -> None:
    count = await db.notifications.estimated_document_count()
    if count > 0:
        return
    if not await acquire_seed_lock("notifications"):
        return

    now = datetime.now(timezone.utc)
    seed = [
        {
            "recipientHandle": "jordankim",
            "type": "like",
            "actors": [
                {"name": "Alex Chen", "handle": "alexchen"},
                {"name": "Dev Patel", "handle": "devpatel"},
            ],
            "extraCount": 4,
            "postExcerpt": "\"Shipping our new onboarding flow today…\"",
            "unread": True,
            "createdAt": now - timedelta(minutes=20),
        },
        {
            "recipientHandle": "jordankim",
            "type": "follow",
            "actors": [{"name": "Maya Torres", "handle": "mayatorres"}],
            "extraCount": None,
            "postExcerpt": None,
            "unread": False,
            "createdAt": now - timedelta(hours=3),
        },
        {
            "recipientHandle": "jordankim",
            "type": "reply",
            "actors": [{"name": "Dev Patel", "handle": "devpatel"}],
            "extraCount": None,
            "postExcerpt": "\"Agreed, and it keeps scroll position intact too.\"",
            "unread": False,
            "createdAt": now - timedelta(hours=5),
        },
    ]
    await db.notifications.insert_many(seed)

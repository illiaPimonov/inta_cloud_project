from .db import acquire_seed_lock, db

SEED_USERS = [
    {
        "name": "Jordan Kim", "handle": "jordankim", "email": "jordan@site.com",
        "passwordHash": "demo", "bio": "Building things on the internet.",
        "location": "Remote", "website": None, "joined": "January 2024",
        "followingCount": 128, "followersCount": 940,
        "isSuggested": False, "isActive": True,
    },
    {
        "name": "Priya Nair", "handle": "priyanair", "email": "priya@site.com",
        "passwordHash": "demo",
        "bio": "Product designer. Building tools for makers. Coffee enthusiast.",
        "location": "Bengaluru", "website": "priyanair.dev", "joined": "March 2021",
        "followingCount": 482, "followersCount": 12400,
        "isSuggested": False, "isActive": True,
    },
    {
        "name": "Dev Patel", "handle": "devpatel", "email": "dev@site.com",
        "passwordHash": "demo", "bio": "Frontend engineer. Open source maintainer.",
        "location": "Toronto", "website": None, "joined": "June 2020",
        "followingCount": 210, "followersCount": 5400,
        "isSuggested": False, "isActive": True,
    },
    {
        "name": "Alex Chen", "handle": "alexchen", "email": "alex@site.com",
        "passwordHash": "demo", "bio": "Product manager. Talks about MVPs and roadmaps.",
        "location": None, "website": None, "joined": "May 2022",
        "followingCount": 0, "followersCount": 0,
        "isSuggested": True, "isActive": True,
    },
    {
        "name": "Maya Torres", "handle": "mayatorres", "email": "maya@site.com",
        "passwordHash": "demo", "bio": "Design systems lead. Writes about scalable UI.",
        "location": None, "website": None, "joined": "August 2021",
        "followingCount": 0, "followersCount": 0,
        "isSuggested": True, "isActive": True,
    },
    {
        "name": "Sam Osei", "handle": "samosei", "email": "sam@site.com",
        "passwordHash": "demo", "bio": "Frontend engineer. Open source maintainer.",
        "location": None, "website": None, "joined": "February 2023",
        "followingCount": 0, "followersCount": 0,
        "isSuggested": True, "isActive": True,
    },
    {
        "name": "Rina Ito", "handle": "rinaito", "email": "rina@site.com",
        "passwordHash": "demo", "bio": "Illustrator. Shares process sketches daily.",
        "location": None, "website": None, "joined": "November 2022",
        "followingCount": 0, "followersCount": 0,
        "isSuggested": True, "isActive": True,
    },
]

async def ensure_seeded() -> None:
    count = await db.users.estimated_document_count()
    if count > 0:
        return
    if not await acquire_seed_lock("users"):
        return
    await db.users.insert_many([dict(u) for u in SEED_USERS])

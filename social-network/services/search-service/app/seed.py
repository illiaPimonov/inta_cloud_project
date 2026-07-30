from .db import acquire_seed_lock, db

TRENDS = [
    {"category": "Technology · Trending", "tag": "#buildinpublic", "postCount": "18.2K posts"},
    {"category": "Design · Trending", "tag": "Design systems", "postCount": "6,204 posts"},
]

SEARCH_DOCS = [
    {"type": "user", "refId": "priyanair", "name": "Priya Nair", "handle": "priyanair",
     "text": "Product designer. Building tools for makers. Coffee enthusiast."},
    {"type": "user", "refId": "devpatel", "name": "Dev Patel", "handle": "devpatel",
     "text": "Frontend engineer. Open source maintainer."},
    {"type": "user", "refId": "mayatorres", "name": "Maya Torres", "handle": "mayatorres",
     "text": "Design systems lead. Writes about scalable UI."},
    {"type": "user", "refId": "alexchen", "name": "Alex Chen", "handle": "alexchen",
     "text": "Product manager. Talks about MVPs and roadmaps."},
    {"type": "user", "refId": "samosei", "name": "Sam Osei", "handle": "samosei",
     "text": "Frontend engineer. Open source maintainer."},
    {"type": "user", "refId": "rinaito", "name": "Rina Ito", "handle": "rinaito",
     "text": "Illustrator. Shares process sketches daily."},
    {"type": "post", "refId": "seed-post-1", "name": "Priya Nair", "handle": "priyanair",
     "text": "Shipping our new onboarding flow today — huge thanks to the team. #buildinpublic"},
    {"type": "post", "refId": "seed-post-2", "name": "Dev Patel", "handle": "devpatel",
     "text": "Hot take: infinite scroll beats pagination for social feeds every time."},
    {"type": "post", "refId": "seed-post-3", "name": "Maya Torres", "handle": "mayatorres",
     "text": "Our new design systems doc is live — covers tokens, components, and contribution guidelines."},
]

async def ensure_seeded() -> None:

    if await db.trends.estimated_document_count() == 0 and await acquire_seed_lock("trends"):
        await db.trends.insert_many([dict(t) for t in TRENDS])
    if await db.searchIndex.estimated_document_count() == 0 and await acquire_seed_lock("searchIndex"):
        await db.searchIndex.insert_many([dict(d) for d in SEARCH_DOCS])

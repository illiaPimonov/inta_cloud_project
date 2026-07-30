import os

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError

MONGO_CONNECTION_STRING = os.environ.get("MONGO_CONNECTION_STRING", "mongodb://localhost:27017")
MONGO_DATABASE_NAME = os.environ.get("MONGO_DATABASE_NAME", "usersdb")
CORS_ALLOWED_ORIGIN = os.environ.get("CORS_ALLOWED_ORIGIN", "http://localhost:3000")

_client = AsyncIOMotorClient(MONGO_CONNECTION_STRING)
db = _client[MONGO_DATABASE_NAME]

def serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    return out

async def acquire_seed_lock(name: str) -> bool:
    try:
        await db.seed_locks.insert_one({"_id": name})
        return True
    except DuplicateKeyError:
        return False

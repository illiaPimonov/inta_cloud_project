import json
import os

from fastapi.encoders import jsonable_encoder
from redis.asyncio import Redis
from redis.exceptions import RedisError

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

_redis = Redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1,
)

stats = {"totalRequests": 0, "mongoReads": 0}

async def cached_json(key: str, ttl_seconds: int, compute):
    stats["totalRequests"] += 1

    if ttl_seconds <= 0:
        stats["mongoReads"] += 1
        result = await compute()
        return jsonable_encoder(result)

    try:
        cached = await _redis.get(key)
        if cached is not None:
            return json.loads(cached)
    except RedisError:
        pass

    stats["mongoReads"] += 1
    result = await compute()
    encoded = jsonable_encoder(result)

    try:
        await _redis.set(key, json.dumps(encoded), ex=ttl_seconds)
    except RedisError:
        pass

    return encoded

async def invalidate_prefix(prefix: str) -> None:
    try:
        async for k in _redis.scan_iter(match=f"{prefix}*"):
            await _redis.delete(k)
    except RedisError:
        pass

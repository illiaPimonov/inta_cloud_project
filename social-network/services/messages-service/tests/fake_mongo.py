import re
from types import SimpleNamespace

from bson import ObjectId
from pymongo.errors import DuplicateKeyError


def _get_path(doc, path):
    node = doc
    for part in path.split("."):
        if not isinstance(node, dict):
            return None
        node = node.get(part)
    return node


def _set_path(doc, path, value):
    parts = path.split(".")
    node = doc
    for part in parts[:-1]:
        node = node.setdefault(part, {})
    node[parts[-1]] = value


def _match_value(actual, expected):
    if isinstance(expected, dict):
        for op, val in expected.items():
            if op == "$ne":
                if actual == val:
                    return False
            elif op == "$in":
                if actual not in val:
                    return False
            elif op == "$regex":
                flags = re.IGNORECASE if expected.get("$options") == "i" else 0
                if not re.search(val, actual if isinstance(actual, str) else "", flags):
                    return False
            elif op == "$options":
                continue
            else:
                raise NotImplementedError(f"unsupported operator: {op}")
        return True
    return actual == expected


def _match(doc, filt):
    for key, expected in (filt or {}).items():
        if key == "$or":
            if not any(_match(doc, sub) for sub in expected):
                return False
            continue
        if not _match_value(doc.get(key), expected):
            return False
    return True


class FakeCursor:
    def __init__(self, docs):
        self._docs = list(docs)

    def sort(self, field, direction=1):
        self._docs.sort(key=lambda d: d.get(field), reverse=(direction == -1))
        return self

    def limit(self, n):
        self._docs = self._docs[:n]
        return self

    async def to_list(self, length=None):
        if length is None:
            return list(self._docs)
        return list(self._docs[:length])


class FakeCollection:
    def __init__(self):
        self._docs = []

    def find(self, filt=None):
        return FakeCursor([d for d in self._docs if _match(d, filt or {})])

    async def find_one(self, filt=None):
        for d in self._docs:
            if _match(d, filt or {}):
                return d
        return None

    async def insert_one(self, doc):
        if "_id" in doc:
            if any(d.get("_id") == doc["_id"] for d in self._docs):
                raise DuplicateKeyError("duplicate _id")
        else:
            doc["_id"] = ObjectId()
        self._docs.append(doc)
        return SimpleNamespace(inserted_id=doc["_id"])

    async def insert_many(self, docs):
        ids = []
        for doc in docs:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self._docs.append(doc)
            ids.append(doc["_id"])
        return SimpleNamespace(inserted_ids=ids)

    async def update_one(self, filt, update):
        for d in self._docs:
            if _match(d, filt or {}):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        _set_path(d, k, v)
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        _set_path(d, k, (_get_path(d, k) or 0) + v)
                return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)

    async def delete_one(self, filt):
        for i, d in enumerate(self._docs):
            if _match(d, filt or {}):
                del self._docs[i]
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    async def create_index(self, *args, **kwargs):
        return None

    async def estimated_document_count(self):
        return len(self._docs)


class FakeDatabase:
    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = FakeCollection()
        return self._collections[name]

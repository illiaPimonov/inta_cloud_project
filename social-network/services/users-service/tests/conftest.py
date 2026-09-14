import importlib
import sys

import pytest
from fastapi.testclient import TestClient

from .fake_mongo import FakeDatabase


def _clear_app_modules():
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]


@pytest.fixture()
def client(monkeypatch):
    # Point at addresses nothing is listening on, so any code path that
    # slips through the fake DB / cache and tries to reach a real Mongo or
    # Redis fails fast instead of hanging or silently hitting a real service.
    monkeypatch.setenv("MONGO_CONNECTION_STRING", "mongodb://127.0.0.1:9")
    monkeypatch.setenv("REDIS_URL", "redis://127.0.0.1:9/0")
    monkeypatch.setenv("CACHE_TTL_SECONDS", "0")

    _clear_app_modules()

    db_module = importlib.import_module("app.db")
    db_module.db = FakeDatabase()

    main_module = importlib.import_module("app.main")

    with TestClient(main_module.app) as test_client:
        yield test_client

    _clear_app_modules()

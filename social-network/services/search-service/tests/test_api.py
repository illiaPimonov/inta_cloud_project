def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_search_empty_query_returns_empty_results(client):
    resp = client.get("/search", params={"q": ""})
    assert resp.status_code == 200
    assert resp.json() == {"users": [], "posts": []}


def test_search_matches_users_and_posts_case_insensitively(client):
    resp = client.get("/search", params={"q": "DESIGN"})
    assert resp.status_code == 200
    body = resp.json()

    user_handles = {u["handle"] for u in body["users"]}
    assert user_handles == {"priyanair", "mayatorres"}

    assert len(body["posts"]) == 1
    assert body["posts"][0]["refId"] == "seed-post-3"


def test_search_no_match_returns_empty_lists(client):
    resp = client.get("/search", params={"q": "nonexistenttopic"})
    assert resp.json() == {"users": [], "posts": []}

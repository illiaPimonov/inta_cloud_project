def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_toggle_like_then_state_reflects_it(client):
    resp = client.post(
        "/engagement/toggle",
        json={"userHandle": "jordankim", "postId": "post-1", "type": "like"},
    )
    assert resp.status_code == 200
    assert resp.json()["active"] is True

    state = client.get(
        "/engagement/state", params={"userHandle": "jordankim", "postIds": "post-1,post-2"}
    ).json()
    assert state["post-1"]["liked"] is True
    assert state["post-2"]["liked"] is False


def test_toggle_twice_removes_engagement(client):
    client.post("/engagement/toggle", json={"userHandle": "jordankim", "postId": "post-1", "type": "like"})
    resp = client.post(
        "/engagement/toggle", json={"userHandle": "jordankim", "postId": "post-1", "type": "like"}
    )
    assert resp.json()["active"] is False


def test_bookmarks_list(client):
    client.post("/engagement/toggle", json={"userHandle": "jordankim", "postId": "post-9", "type": "bookmark"})
    resp = client.get("/engagement/bookmarks", params={"userHandle": "jordankim"})
    assert resp.status_code == 200
    assert resp.json() == ["post-9"]


def test_likes_list_is_scoped_per_user(client):
    client.post("/engagement/toggle", json={"userHandle": "jordankim", "postId": "post-1", "type": "like"})
    client.post("/engagement/toggle", json={"userHandle": "someoneelse", "postId": "post-1", "type": "like"})

    resp = client.get("/engagement/likes", params={"userHandle": "jordankim"})
    assert resp.json() == ["post-1"]

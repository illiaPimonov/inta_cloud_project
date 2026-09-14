def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_posts_excludes_replies_by_default(client):
    resp = client.get("/posts")
    assert resp.status_code == 200
    posts = resp.json()
    assert len(posts) == 3
    assert all(p["replyToPostId"] is None for p in posts)
    # sorted by createdAt descending: priyanair (2h ago) is the most recent
    assert posts[0]["authorHandle"] == "priyanair"


def test_list_posts_type_all_includes_replies(client):
    resp = client.get("/posts", params={"type": "all"})
    assert resp.status_code == 200
    assert len(resp.json()) == 4


def test_get_single_post_by_id(client):
    posts = client.get("/posts").json()
    post_id = posts[0]["id"]
    resp = client.get(f"/posts/{post_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == post_id


def test_get_post_missing_id_returns_404(client):
    resp = client.get("/posts/000000000000000000000000")
    assert resp.status_code == 404


def test_create_post_appears_in_list(client):
    resp = client.post(
        "/posts",
        json={"authorHandle": "newuser", "authorName": "New User", "text": "hello world"},
    )
    assert resp.status_code == 201

    listed = client.get("/posts", params={"authorHandle": "newuser"}).json()
    assert len(listed) == 1
    assert listed[0]["text"] == "hello world"
    assert listed[0]["stats"] == {"replies": 0, "reposts": 0, "likes": 0}


def test_update_counters_increments_likes(client):
    posts = client.get("/posts").json()
    post_id = posts[0]["id"]
    before = posts[0]["stats"]["likes"]

    resp = client.patch(f"/posts/{post_id}/counters", json={"field": "likes", "delta": 1})
    assert resp.status_code == 200

    after = client.get(f"/posts/{post_id}").json()
    assert after["stats"]["likes"] == before + 1


def test_delete_post_requires_matching_author(client):
    created = client.post(
        "/posts",
        json={"authorHandle": "owner", "authorName": "Owner", "text": "mine"},
    ).json()
    post_id = created["id"]

    wrong = client.delete(f"/posts/{post_id}", params={"authorHandle": "someoneelse"})
    assert wrong.status_code == 403

    right = client.delete(f"/posts/{post_id}", params={"authorHandle": "owner"})
    assert right.status_code == 204

    assert client.get(f"/posts/{post_id}").status_code == 404

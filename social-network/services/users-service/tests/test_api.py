def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_users_returns_seeded_users(client):
    resp = client.get("/users")
    assert resp.status_code == 200
    handles = {u["handle"] for u in resp.json()}
    assert handles == {
        "jordankim", "priyanair", "devpatel", "alexchen", "mayatorres", "samosei", "rinaito",
    }


def test_list_users_excludes_given_handle(client):
    resp = client.get("/users", params={"exclude": "jordankim"})
    handles = {u["handle"] for u in resp.json()}
    assert "jordankim" not in handles
    assert len(handles) == 6


def test_get_user_by_handle(client):
    resp = client.get("/users/priyanair")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Priya Nair"


def test_get_unknown_user_returns_404(client):
    assert client.get("/users/doesnotexist").status_code == 404


def test_login_with_valid_credentials(client):
    resp = client.post("/users/login", json={"identifier": "jordankim", "password": "anything"})
    assert resp.status_code == 200
    assert resp.json()["handle"] == "jordankim"


def test_login_with_empty_password_fails(client):
    resp = client.post("/users/login", json={"identifier": "jordankim", "password": ""})
    assert resp.status_code == 401


def test_register_new_user(client):
    resp = client.post(
        "/users/register",
        json={
            "displayName": "New Person",
            "username": "NewPerson",
            "email": "new@site.com",
            "password": "secret",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["handle"] == "newperson"


def test_register_duplicate_username_fails(client):
    resp = client.post(
        "/users/register",
        json={
            "displayName": "Dup",
            "username": "jordankim",
            "email": "dup@site.com",
            "password": "secret",
        },
    )
    assert resp.status_code == 409


def test_follow_toggle_updates_counts(client):
    before = client.get("/users/devpatel").json()["followersCount"]

    resp = client.post("/users/follow", json={"viewerHandle": "jordankim", "targetHandle": "devpatel"})
    assert resp.status_code == 200
    assert resp.json()["following"] is True

    after_follow = client.get("/users/devpatel").json()["followersCount"]
    assert after_follow == before + 1

    resp = client.post("/users/follow", json={"viewerHandle": "jordankim", "targetHandle": "devpatel"})
    assert resp.json()["following"] is False

    after_unfollow = client.get("/users/devpatel").json()["followersCount"]
    assert after_unfollow == before

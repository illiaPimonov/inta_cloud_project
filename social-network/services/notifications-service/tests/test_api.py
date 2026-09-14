def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_notifications_sorted_newest_first(client):
    resp = client.get("/notifications", params={"userHandle": "jordankim"})
    assert resp.status_code == 200
    notifications = resp.json()
    assert len(notifications) == 3
    assert [n["type"] for n in notifications] == ["like", "follow", "reply"]
    assert notifications[0]["unread"] is True


def test_mark_read(client):
    notifications = client.get("/notifications", params={"userHandle": "jordankim"}).json()
    unread_id = notifications[0]["id"]

    resp = client.patch(f"/notifications/{unread_id}/read")
    assert resp.status_code == 200
    assert resp.json()["unread"] is False

    updated = client.get("/notifications", params={"userHandle": "jordankim"}).json()
    assert updated[0]["unread"] is False


def test_mark_read_unknown_id_returns_404(client):
    assert client.patch("/notifications/000000000000000000000000/read").status_code == 404


def test_create_notification_appears_in_list(client):
    resp = client.post(
        "/notifications",
        json={
            "recipientHandle": "jordankim",
            "type": "follow",
            "actorHandle": "rinaito",
            "actorName": "Rina Ito",
        },
    )
    assert resp.status_code == 201

    notifications = client.get("/notifications", params={"userHandle": "jordankim"}).json()
    assert len(notifications) == 4
    assert notifications[0]["actors"][0]["handle"] == "rinaito"


def test_create_notification_skipped_when_actor_is_recipient(client):
    resp = client.post(
        "/notifications",
        json={
            "recipientHandle": "jordankim",
            "type": "like",
            "actorHandle": "jordankim",
            "actorName": "Jordan Kim",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["skipped"] is True

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_conversations_sorted_by_recency(client):
    resp = client.get("/conversations", params={"userHandle": "jordankim"})
    assert resp.status_code == 200
    convos = resp.json()
    assert len(convos) == 3
    assert [c["otherHandle"] for c in convos] == ["mayatorres", "devpatel", "alexchen"]


def test_get_messages_marks_conversation_read(client):
    convo = client.get("/conversations", params={"userHandle": "jordankim"}).json()[0]
    assert convo["unread"] is True

    messages = client.get(
        f"/conversations/{convo['id']}/messages", params={"userHandle": "jordankim"}
    ).json()
    assert len(messages) == 3

    convo_after = client.get("/conversations", params={"userHandle": "jordankim"}).json()[0]
    assert convo_after["unread"] is False


def test_send_message_updates_conversation_preview(client):
    convo = client.get("/conversations", params={"userHandle": "jordankim"}).json()[0]

    resp = client.post(
        f"/conversations/{convo['id']}/messages",
        json={"fromHandle": "jordankim", "text": "new reply"},
    )
    assert resp.status_code == 201
    assert resp.json()["text"] == "new reply"

    updated = client.get("/conversations", params={"userHandle": "jordankim"}).json()[0]
    assert updated["lastMessage"] == "new reply"
    assert updated["lastMessageFromMe"] is True


def test_start_conversation_reuses_existing(client):
    resp = client.post(
        "/conversations",
        json={
            "initiatorHandle": "jordankim",
            "initiatorName": "Jordan Kim",
            "recipientHandle": "devpatel",
            "recipientName": "Dev Patel",
        },
    )
    assert resp.status_code == 201

    existing_ids = {
        c["id"] for c in client.get("/conversations", params={"userHandle": "jordankim"}).json()
    }
    assert resp.json()["id"] in existing_ids
    assert len(existing_ids) == 3  # no new conversation was created

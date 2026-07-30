"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import { ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle, getCurrentUserName } from "@/lib/session";
import type { ServiceConversationSummary, ServiceMessage } from "@/lib/services/types";
import type { User } from "@/lib/types";
import styles from "./page.module.css";

type Status = "loading" | "error" | "ready";

const THREAD_POLL_MS = 4000;

const CONVERSATIONS_POLL_MS = 8000;

export default function MessagesPage() {
  const userHandle = getCurrentUserHandle();
  const userName = getCurrentUserName();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<ServiceConversationSummary[]>([]);
  const [listStatus, setListStatus] = useState<Status>("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [thread, setThread] = useState<ServiceMessage[]>([]);
  const [threadStatus, setThreadStatus] = useState<Status>("ready");

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [ncQuery, setNcQuery] = useState("");
  const [ncResults, setNcResults] = useState<User[]>([]);
  const [ncSearching, setNcSearching] = useState(false);
  const [ncStartingHandle, setNcStartingHandle] = useState<string | null>(null);

  const isSearching = query.trim().length > 0;
  const selected = conversations.find((c) => c.id === selectedId);

  const loadConversations = () => {
    setListStatus("loading");
    fetch(`/api/bff/messages?userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: ServiceConversationSummary[]) => {
        setConversations(data);
        setListStatus("ready");
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((err) => {
        console.error("[messages] failed to load conversations", err);
        setListStatus("error");
      });
  };

  useEffect(loadConversations, [userHandle]);

  useEffect(() => {
    if (!userHandle) return;
    const interval = window.setInterval(() => {
      fetch(`/api/bff/messages?userHandle=${encodeURIComponent(userHandle)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: ServiceConversationSummary[] | null) => {
          if (data) setConversations(data);
        })
        .catch((err) => console.error("[messages] conversation list poll failed", err));
    }, CONVERSATIONS_POLL_MS);
    return () => window.clearInterval(interval);
  }, [userHandle]);

  const loadThread = (conversationId: string) => {
    setThreadStatus("loading");
    fetch(`/api/bff/messages/${conversationId}?userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: ServiceMessage[]) => {
        setThread(data);
        setThreadStatus("ready");

        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c)));
      })
      .catch((err) => {
        console.error("[messages] failed to load thread", err);
        setThreadStatus("error");
      });
  };

  useEffect(() => {
    if (!selectedId || isSearching) return;
    loadThread(selectedId);

  }, [selectedId, userHandle]);

  useEffect(() => {
    if (!selectedId || isSearching) return;
    const interval = window.setInterval(() => {
      fetch(`/api/bff/messages/${selectedId}?userHandle=${encodeURIComponent(userHandle ?? "")}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: ServiceMessage[] | null) => {
          if (!data) return;
          setThread((prev) => {
            const samePrevLast = prev[prev.length - 1]?.id;
            const sameNextLast = data[data.length - 1]?.id;
            if (prev.length === data.length && samePrevLast === sameNextLast) return prev;
            return data;
          });
          setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unread: false } : c)));
        })
        .catch((err) => console.error("[messages] thread poll failed", err));
    }, THREAD_POLL_MS);
    return () => window.clearInterval(interval);
  }, [selectedId, isSearching, userHandle]);

  const filtered = useMemo(
    () =>
      isSearching
        ? conversations.filter((c) => c.otherName.toLowerCase().includes(query.toLowerCase()))
        : conversations,
    [conversations, query, isSearching]
  );

  const sendMessage = async () => {
    if (!draft.trim() || !selected || sending) return;
    setSending(true);
    const text = draft;
    setDraft("");
    try {
      const res = await fetch(`/api/bff/messages/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromHandle: userHandle, text }),
      });
      if (!res.ok) throw new Error(`BFF responded ${res.status}`);
      const message: ServiceMessage = await res.json();

      setThread((prev) => [...prev, { ...message, fromMe: true }]);
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selected.id
              ? { ...c, lastMessage: text, lastMessageFromMe: true, updatedAt: new Date().toISOString() }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (err) {
      console.error("[messages] send failed", err);
      showToast("Couldn't send that message — check the backend connection", "error");
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const trimmed = ncQuery.trim();
    if (!newMessageOpen || !trimmed) {
      setNcResults([]);
      return;
    }
    setNcSearching(true);
    const t = window.setTimeout(() => {
      fetch(`/api/bff/search?q=${encodeURIComponent(trimmed)}&userHandle=${encodeURIComponent(userHandle ?? "")}`)
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((data: { users: User[] }) => {
          setNcResults(data.users.filter((u) => u.handle !== userHandle));
        })
        .catch((err) => console.error("[messages] recipient search failed", err))
        .finally(() => setNcSearching(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [ncQuery, newMessageOpen, userHandle]);

  const openNewMessage = () => {
    setNcQuery("");
    setNcResults([]);
    setNewMessageOpen(true);
  };

  const startConversation = async (recipient: User) => {
    if (!userHandle || ncStartingHandle) return;
    setNcStartingHandle(recipient.handle);
    try {
      const res = await fetch("/api/bff/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiatorHandle: userHandle,
          initiatorName: userName,
          recipientHandle: recipient.handle,
          recipientName: recipient.name,
        }),
      });
      if (!res.ok) {
        showToast("Couldn't start that conversation — is the backend running?", "error");
        return;
      }
      const conversation: { id: string } = await res.json();
      setNewMessageOpen(false);
      setSelectedId(conversation.id);
      loadConversations();
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setNcStartingHandle(null);
    }
  };

  return (
    <>
      <section className={styles.list}>
        <div className={styles.listHeader}>
          <div className={styles.listTitle}>Messages</div>
          <div className={styles.headerActions}>
            <span className={styles.filterPill}>
              All <Icon name="chevron-down" size={12} />
            </span>
            <button className={styles.newBtn} onClick={openNewMessage} aria-label="New message">
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <div className={`${styles.searchInputWrap} ${isSearching ? styles.active : ""}`}>
            <input
              className={styles.searchInput}
              placeholder="Search Direct Messages"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isSearching && (
              <button className={styles.clearBtn} onClick={() => setQuery("")} aria-label="Clear search">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>

        {isSearching && (
          <div className={styles.resultTabs}>
            <button className={`${styles.resultTab} ${styles.active}`}>
              Conversations ({filtered.length})
            </button>
          </div>
        )}

        {listStatus === "loading" && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {listStatus === "error" && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={loadConversations} />
          </div>
        )}

        {listStatus === "ready" && isSearching
          ? filtered.map((c) => (
              <div key={c.id} className={styles.centeredResult}>
                <Avatar name={c.otherName} size={56} />
                <div className={styles.centeredName}>{c.otherName}</div>
                <div className={styles.centeredHandle}>@{c.otherHandle}</div>
              </div>
            ))
          : null}

        {listStatus === "ready" && !isSearching
          ? filtered.map((c) => (
              <button
                key={c.id}
                className={`${styles.convoRow} ${c.id === selectedId ? styles.selected : ""}`}
                onClick={() => setSelectedId(c.id)}
              >
                <Avatar name={c.otherName} size={44} />
                <div className={styles.convoInfo}>
                  <div className={styles.convoTop}>
                    <span className={styles.convoName}>{c.otherName}</span>
                    <span className={styles.convoTime}>{new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className={`${styles.convoPreview} ${c.unread ? styles.unread : ""}`}>
                    {c.lastMessageFromMe ? `You: ${c.lastMessage}` : c.lastMessage}
                  </div>
                </div>
                {c.unread && <span className={styles.unreadDot} />}
              </button>
            ))
          : null}
      </section>

      {isSearching || !selected ? (
        <section className={styles.thread}>
          <div className={styles.emptyThread}>
            <div className={styles.emptyIconWrap}>
              <Icon name="messages" size={16} />
            </div>
            <div className={styles.emptyTitle}>Start a conversation</div>
            <div className={styles.emptySubtitle}>
              Choose from your existing conversations, or start a new one
            </div>
            <button
              onClick={openNewMessage}
              style={{
                marginTop: 16,
                background: "var(--color-text-primary)",
                color: "var(--color-surface)",
                fontSize: 14,
                fontWeight: 700,
                padding: "0 20px",
                height: 36,
                borderRadius: "var(--radius-pill)",
                border: "none",
              }}
            >
              New message
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.thread}>
          <div className={styles.threadHeader}>
            <Avatar name={selected.otherName} size={32} />
            <div>
              <div className={styles.threadHeaderName}>{selected.otherName}</div>
              <div className={styles.threadHeaderHandle}>@{selected.otherHandle}</div>
            </div>
          </div>

          {threadStatus === "loading" && (
            <div style={{ padding: 20 }}>
              <LoadingSkeleton />
            </div>
          )}
          {threadStatus === "error" && (
            <div style={{ padding: 20 }}>
              <ErrorState onRetry={() => loadThread(selected.id)} />
            </div>
          )}
          {threadStatus === "ready" && (
            <div className={styles.messages}>
              {thread.map((m) => (
                <div key={m.id} className={`${styles.bubble} ${m.fromMe ? styles.mine : ""}`}>
                  {m.text}
                </div>
              ))}
              {thread.length > 0 && (
                <div className={styles.seen}>
                  {new Date(thread[thread.length - 1].sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          )}

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              className={styles.composerInput}
              placeholder="Start a new message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || sending} aria-label="Send">
              <Icon name="send" size={18} color="#fff" />
            </button>
          </form>
        </section>
      )}

      {newMessageOpen && (
        <div className={styles.ncScrim} onMouseDown={(e) => e.target === e.currentTarget && setNewMessageOpen(false)}>
          <div className={styles.ncModal} role="dialog" aria-modal="true" aria-label="New message">
            <div className={styles.ncHeader}>
              <button className={styles.ncCloseBtn} onClick={() => setNewMessageOpen(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
              <div className={styles.ncTitle}>New message</div>
            </div>
            <div className={styles.ncSearchWrap}>
              <div className={styles.searchInputWrap}>
                <input
                  className={styles.searchInput}
                  placeholder="Search people"
                  value={ncQuery}
                  onChange={(e) => setNcQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.ncResults}>
              {ncSearching && (
                <div style={{ padding: 16 }}>
                  <LoadingSkeleton />
                </div>
              )}
              {!ncSearching && ncQuery.trim() && ncResults.length === 0 && (
                <div className={styles.ncEmpty}>No one found</div>
              )}
              {!ncSearching && !ncQuery.trim() && (
                <div className={styles.ncEmpty}>Search for someone to message</div>
              )}
              {!ncSearching &&
                ncResults.map((u) => (
                  <button
                    key={u.id}
                    className={styles.ncResultRow}
                    onClick={() => startConversation(u)}
                    disabled={ncStartingHandle === u.handle}
                  >
                    <Avatar name={u.name} size={40} />
                    <div className={styles.ncResultInfo}>
                      <div className={styles.ncResultName}>{u.name}</div>
                      <div className={styles.ncResultHandle}>@{u.handle}</div>
                    </div>
                    {ncStartingHandle === u.handle && <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Starting…</span>}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

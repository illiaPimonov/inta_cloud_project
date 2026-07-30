"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import PostCard from "@/components/PostCard";
import UserCard from "@/components/UserCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import type { Post, User } from "@/lib/types";
import styles from "./page.module.css";

const RESULT_TABS = ["Top", "Latest", "People", "Media"];
const RECENT_KEY = "sn_recent_searches";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

interface SearchResponse {
  users: User[];
  posts: Post[];
}

export default function SearchPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Top");
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResponse>({ users: [], posts: [] });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const userHandle = getCurrentUserHandle();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const runSearch = (trimmed: string) => {
    if (!trimmed) {
      setResults({ users: [], posts: [] });
      setStatus("idle");
      return;
    }
    setStatus("loading");
    fetch(`/api/bff/search?q=${encodeURIComponent(trimmed)}&userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: SearchResponse) => {
        setResults(data);
        setStatus("ready");
        setRemovedIds(new Set());
        const nextRecent = [trimmed, ...loadRecent().filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
        saveRecent(nextRecent);
        setRecent(nextRecent);
      })
      .catch((err) => {
        console.error("[search] failed", err);
        setStatus("error");
      });
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ users: [], posts: [] });
      setStatus("idle");
      return;
    }
    const t = window.setTimeout(() => runSearch(trimmed), 400);
    return () => window.clearTimeout(t);

  }, [query, userHandle]);

  const handleFollowChange = (targetHandle: string, following: boolean) => {
    if (!userHandle) return;
    fetch("/api/bff/follow/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerHandle: userHandle, targetHandle }),
    }).catch((err) => {
      console.error("[search] follow toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });
  };

  const handleDeleted = (postId: string) => {
    setRemovedIds((prev) => new Set(prev).add(postId));
  };

  const showUsers = tab === "People" || tab === "Top";
  const showPosts = tab !== "People";

  const postsForTab =
    tab === "Media"
      ? results.posts.filter((p) => p.hasMedia)
      : tab === "Latest"
      ? [...results.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : results.posts;
  const visiblePosts = postsForTab.filter((p) => !removedIds.has(p.id));
  const visibleUsers = tab === "Top" ? results.users.slice(0, 1) : results.users;

  const hasResults = (showUsers && visibleUsers.length > 0) || (showPosts && visiblePosts.length > 0);

  return (
    <>
      <section className={styles.column}>
        <div className={styles.searchBar}>
          <div className={styles.inputWrap}>
            <Icon name="search" size={16} color="var(--color-text-tertiary)" />
            <input
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
            />
          </div>
        </div>

        <Tabs tabs={RESULT_TABS} active={tab} onChange={setTab} height={48} />

        {status === "idle" && (
          <div style={{ padding: 20 }}>
            <EmptyState title="Search Social" subtitle="Find people and posts" />
          </div>
        )}

        {status === "loading" && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={() => runSearch(query.trim())} />
          </div>
        )}

        {status === "ready" && !hasResults && (
          <div style={{ padding: 20 }}>
            <EmptyState title="No results" subtitle="Try searching for something else" />
          </div>
        )}

        {status === "ready" &&
          showUsers &&
          visibleUsers.map((u) => (
            <UserCard key={u.id} user={u} showBio size={48} onFollowChange={handleFollowChange} />
          ))}

        {status === "ready" &&
          showPosts &&
          visiblePosts.map((p) => <PostCard key={p.id} post={p} onDeleted={handleDeleted} />)}
      </section>

      <aside className={styles.rail}>
        <div className={styles.railTitle}>Recent searches</div>
        {recent.map((r) => (
          <div key={r} className={styles.recentRow}>
            <span style={{ cursor: "pointer" }} onClick={() => setQuery(r)}>
              {r}
            </span>
            <button
              onClick={() => {
                const next = recent.filter((x) => x !== r);
                setRecent(next);
                saveRecent(next);
              }}
              aria-label={`Remove ${r}`}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        {recent.length > 0 && (
          <button
            className={styles.clearAll}
            onClick={() => {
              setRecent([]);
              saveRecent([]);
            }}
          >
            Clear all
          </button>
        )}
      </aside>
    </>
  );
}

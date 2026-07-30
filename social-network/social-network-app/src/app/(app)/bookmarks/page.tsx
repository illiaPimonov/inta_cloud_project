"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import PostCard from "@/components/PostCard";
import { EmptyState, EndOfList, ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import type { Post } from "@/lib/types";

export default function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [clearing, setClearing] = useState(false);
  const { showToast } = useToast();

  const userHandle = getCurrentUserHandle();

  const load = () => {
    setStatus("loading");
    fetch(`/api/bff/bookmarks?userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: Post[]) => {
        setPosts(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[bookmarks] failed to load", err);
        setStatus("error");
      });
  };

  useEffect(load, [userHandle]);

  const handleEngagementToggle = (postId: string) => (type: "like" | "repost" | "bookmark", nextActive: boolean) => {
    fetch("/api/bff/engagement/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userHandle, postId, type }),
    }).catch((err) => {
      console.error("[bookmarks] engagement toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });

    if (type === "bookmark" && !nextActive) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const clearAll = async () => {
    if (!userHandle || posts.length === 0 || clearing) return;
    const confirmed = window.confirm(`Remove all ${posts.length} bookmarks?`);
    if (!confirmed) return;
    setClearing(true);
    try {
      await Promise.all(
        posts.map((p) =>
          fetch("/api/bff/engagement/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userHandle, postId: p.id, type: "bookmark" }),
          })
        )
      );
      setPosts([]);
      showToast("Bookmarks cleared", "success");
    } catch {
      showToast("Couldn't clear all bookmarks — check the backend connection", "error");
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <section style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: "var(--topnav-height)",
            flexShrink: 0,
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Bookmarks</div>
          <button
            style={{
              background: "none",
              border: "none",
              display: "flex",
              color: "var(--color-text-secondary)",
              opacity: posts.length === 0 || clearing ? 0.5 : 1,
            }}
            onClick={clearAll}
            disabled={posts.length === 0 || clearing}
            aria-label="Clear all bookmarks"
            title="Clear all bookmarks"
          >
            <Icon name="more" size={18} />
          </button>
        </div>

        {status === "loading" && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={load} />
          </div>
        )}

        {status === "ready" && posts.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState title="Nothing here yet" subtitle="Posts you bookmark will show up here" />
          </div>
        )}

        {status === "ready" && posts.length > 0 && (
          <>
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onEngagementToggle={handleEngagementToggle(p.id)}
                onDeleted={handleDeleted}
              />
            ))}
            <EndOfList />
          </>
        )}
      </section>
      <aside style={{ width: "var(--rail-width)", flexShrink: 0 }} />
    </>
  );
}

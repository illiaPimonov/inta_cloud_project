"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import PostCard from "@/components/PostCard";
import RightRail from "@/components/RightRail";
import { EmptyState, EndOfList, ErrorState, LoadingSkeleton } from "@/components/States";
import { useCompose } from "@/store/composeStore";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle, getCurrentUserName } from "@/lib/session";
import type { Post, Trend, User } from "@/lib/types";
import styles from "./page.module.css";

const TABS = ["For you", "Following", "Design", "Product"];

const NEW_POSTS_POLL_MS = 10000;

interface HomeFeedResponse {
  posts: Post[];
  trends: Trend[];
  suggestions: User[];
}

export default function HomePage() {
  const [tabs, setTabs] = useState<string[]>(TABS);
  const [tab, setTab] = useState("For you");
  const [feed, setFeed] = useState<HomeFeedResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const [pendingNewPosts, setPendingNewPosts] = useState<Post[]>([]);
  const { openCompose, postVersion } = useCompose();
  const { showToast } = useToast();

  const userHandle = getCurrentUserHandle();
  const userName = getCurrentUserName();

  const latestSeenAtRef = useRef<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const loadFeed = () => {
    setStatus("loading");
    fetch(`/api/bff/home?userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: HomeFeedResponse) => {
        setFeed(data);
        setPendingNewPosts([]);
        latestSeenAtRef.current = data.posts[0]?.createdAt ?? null;
        knownIdsRef.current = new Set(data.posts.map((p) => p.id));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[home] failed to load feed", err);
        setStatus("error");
      });
  };

  useEffect(loadFeed, [userHandle, postVersion]);

  useEffect(() => {
    if (!userHandle) return;
    const poll = () => {
      fetch(`/api/bff/home?userHandle=${encodeURIComponent(userHandle)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: HomeFeedResponse | null) => {
          if (!data) return;
          const fresh = data.posts.filter(
            (p) =>
              !knownIdsRef.current.has(p.id) &&
              (!latestSeenAtRef.current ||
                new Date(p.createdAt).getTime() > new Date(latestSeenAtRef.current).getTime())
          );
          setPendingNewPosts(fresh);
        })
        .catch((err) => console.error("[home] poll for new posts failed", err));
    };
    const interval = window.setInterval(poll, NEW_POSTS_POLL_MS);
    return () => window.clearInterval(interval);
  }, [userHandle]);

  const revealNewPosts = () => {
    if (pendingNewPosts.length === 0) return;
    setFeed((prev) => (prev ? { ...prev, posts: [...pendingNewPosts, ...prev.posts] } : prev));
    pendingNewPosts.forEach((p) => knownIdsRef.current.add(p.id));
    latestSeenAtRef.current = pendingNewPosts[0].createdAt;
    setPendingNewPosts([]);
  };

  const handleAddFeed = () => {
    const name = window.prompt("Name your new feed tab:");
    const trimmed = name?.trim();
    if (!trimmed) return;
    if (tabs.includes(trimmed)) {
      setTab(trimmed);
      return;
    }
    setTabs((prev) => [...prev, trimmed]);
    setTab(trimmed);
    showToast(`Added "${trimmed}" — this is an empty feed tab in the demo`, "info");
  };

  const handleEngagementToggle = (postId: string) => (type: "like" | "repost" | "bookmark", nextActive: boolean) => {
    fetch("/api/bff/engagement/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userHandle, postId, type }),
    }).catch((err) => {
      console.error("[home] engagement toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });

    void nextActive;
  };

  const handleDeleted = (postId: string) => {
    setRemovedIds((prev) => new Set(prev).add(postId));
  };

  const feedPosts = (
    tab === "For you"
      ? feed?.posts ?? []
      : tab === "Following"
      ? (feed?.posts ?? []).slice(0, 2)
      : []
  ).filter((p) => !removedIds.has(p.id));

  return (
    <>
      <section className={styles.feed}>
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={setTab}
          trailing={
            <button className={styles.addFeedBtn} aria-label="Add feed" onClick={handleAddFeed}>
              <Icon name="plus" size={16} />
            </button>
          }
          height={56}
        />

        <div className={styles.composer}>
          <div className={styles.composerRow}>
            <Avatar name={userName} size={40} />
            <button className={styles.composerPrompt} onClick={openCompose}>
              What&apos;s happening?
            </button>
          </div>
          <div className={styles.composerActions}>
            <button
              onClick={openCompose}
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                padding: "0 20px",
                height: 36,
                borderRadius: "var(--radius-pill)",
                border: "none",
              }}
            >
              Post
            </button>
          </div>
        </div>

        {pendingNewPosts.length > 0 && tab === "For you" && status === "ready" && (
          <button className={styles.newPostsPill} onClick={revealNewPosts}>
            Show {pendingNewPosts.length} new post{pendingNewPosts.length === 1 ? "" : "s"}
          </button>
        )}

        <div className={styles.list}>
          {status === "loading" && (
            <div style={{ padding: 20 }}>
              <LoadingSkeleton />
            </div>
          )}

          {status === "error" && (
            <div style={{ padding: 20 }}>
              <ErrorState onRetry={loadFeed} />
            </div>
          )}

          {status === "ready" && feedPosts.length === 0 && (
            <div style={{ padding: 20 }}>
              <EmptyState title="No posts yet" subtitle="Posts from this feed will show up here" />
            </div>
          )}

          {status === "ready" &&
            feedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEngagementToggle={handleEngagementToggle(post.id)}
                onDeleted={handleDeleted}
              />
            ))}

          {status === "ready" && <EndOfList />}
        </div>
      </section>

      <RightRail trends={feed?.trends} suggestions={feed?.suggestions} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import Tabs from "@/components/Tabs";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import SearchBox from "@/components/SearchBox";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import type { Post, User } from "@/lib/types";
import styles from "./page.module.css";

const TABS = ["Posts", "Replies", "Media", "Likes"];
const TAB_TO_PARAM: Record<string, string> = {
  Posts: "posts",
  Replies: "replies",
  Media: "media",
  Likes: "likes",
};

interface ProfileResponse {
  user: User;
  isMe: boolean;
  posts: Post[];
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState("Posts");
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "notfound" | "ready">("loading");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const viewerHandle = getCurrentUserHandle();

  const load = () => {
    setStatus("loading");
    const tabParam = TAB_TO_PARAM[tab];
    fetch(
      `/api/bff/profile/${encodeURIComponent(params.username)}?viewerHandle=${encodeURIComponent(
        viewerHandle ?? ""
      )}&tab=${tabParam}`
    )
      .then((res) => {
        if (res.status === 404) {
          setStatus("notfound");
          return null;
        }
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((json: ProfileResponse | null) => {
        if (!json) return;
        setData(json);
        setRemovedIds(new Set());
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[profile] failed to load", err);
        setStatus("error");
      });
  };

  useEffect(load, [params.username, tab, viewerHandle]);

  const handleFollowChange = (following: boolean) => {
    if (!viewerHandle || !data) return;
    fetch("/api/bff/follow/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerHandle, targetHandle: data.user.handle }),
    }).catch((err) => {
      console.error("[profile] follow toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            user: {
              ...prev.user,
              isFollowing: following,
              followersCount: (prev.user.followersCount ?? 0) + (following ? 1 : -1),
            },
          }
        : prev
    );
  };

  const handleDeleted = (postId: string) => {
    setRemovedIds((prev) => new Set(prev).add(postId));
  };

  if (status === "notfound") {
    return (
      <section className={styles.column}>
        <div style={{ padding: 20 }}>
          <EmptyState title="This account doesn't exist" subtitle="Try searching for a different handle" />
        </div>
      </section>
    );
  }

  const user = data?.user;
  const isMe = data?.isMe ?? params.username === viewerHandle;
  const posts = (data?.posts ?? []).filter((p) => !removedIds.has(p.id));

  return (
    <>
      <section className={styles.column}>
        {status === "loading" && !data && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {status === "error" && !data && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={load} />
          </div>
        )}

        {user && (
          <>
            <div className={styles.cover}>
              <div className={styles.avatarWrap}>
                <Avatar name={user.name} size={88} border />
              </div>
              {isMe ? (
                <button className={styles.editBtn} onClick={() => router.push("/settings")}>
                  Edit profile
                </button>
              ) : (
                <div style={{ position: "absolute", top: 16, right: 24 }}>
                  <FollowButton key={user.handle} initiallyFollowing={user.isFollowing} onChange={handleFollowChange} />
                </div>
              )}
            </div>

            <div className={styles.info}>
              <div className={styles.name}>{user.name}</div>
              <div className={styles.handle}>@{user.handle}</div>
              {user.bio && <div className={styles.bio}>{user.bio}</div>}
              <div className={styles.metaRow}>
                {user.location && (
                  <span className={styles.metaItem}>
                    <Icon name="location" size={14} color="var(--color-text-secondary)" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <span className={styles.metaItem}>
                    <Icon name="link" size={14} color="var(--color-text-secondary)" />
                    {user.website}
                  </span>
                )}
                {user.joined && <span>Joined {user.joined}</span>}
              </div>
              <div className={styles.statsRow}>
                <span>
                  <span className={styles.statValue}>{user.followingCount ?? 0}</span>{" "}
                  <span className={styles.statLabel}>Following</span>
                </span>
                <span>
                  <span className={styles.statValue}>
                    {(user.followersCount ?? 0) >= 1000
                      ? `${((user.followersCount ?? 0) / 1000).toFixed(1)}K`
                      : user.followersCount ?? 0}
                  </span>{" "}
                  <span className={styles.statLabel}>Followers</span>
                </span>
              </div>
            </div>

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {status === "loading" && (
              <div style={{ padding: 20 }}>
                <LoadingSkeleton />
              </div>
            )}

            {status === "ready" && posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} onDeleted={handleDeleted} />)
            ) : status === "ready" ? (
              <div style={{ padding: 20 }}>
                <EmptyState title="Nothing here yet" subtitle={`${user.name}'s ${tab.toLowerCase()} will show up here`} />
              </div>
            ) : null}
          </>
        )}
      </section>
      <aside style={{ width: "var(--rail-width)", flexShrink: 0, padding: 20 }}>
        <SearchBox />
      </aside>
    </>
  );
}

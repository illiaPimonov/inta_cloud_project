"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import TopBar from "@/components/TopBar";
import PostCard from "@/components/PostCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle, getCurrentUserName } from "@/lib/session";
import type { Post } from "@/lib/types";
import styles from "./page.module.css";

interface PostDetailResponse {
  post: Post;
  replies: Post[];
}

export default function PostDetailsPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [data, setData] = useState<PostDetailResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "notfound" | "ready">("loading");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [reposts, setReposts] = useState(0);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const viewerHandle = getCurrentUserHandle();
  const viewerName = getCurrentUserName();

  const load = () => {
    setStatus("loading");
    fetch(`/api/bff/post/${params.id}?userHandle=${encodeURIComponent(viewerHandle ?? "")}`)
      .then((res) => {
        if (res.status === 404) {
          setStatus("notfound");
          return null;
        }
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((json: PostDetailResponse | null) => {
        if (!json) return;
        setData(json);
        setLiked(!!json.post.liked);
        setLikes(json.post.stats.likes);
        setBookmarked(!!json.post.bookmarked);
        setReposted(!!json.post.reposted);
        setReposts(json.post.stats.reposts);
        setRemovedIds(new Set());
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[post] failed to load", err);
        setStatus("error");
      });
  };

  useEffect(load, [params.id, viewerHandle]);

  useEffect(() => {
    if (replyOpen) window.setTimeout(() => replyRef.current?.focus(), 10);
  }, [replyOpen]);

  const persistEngagement = (type: "like" | "repost" | "bookmark") => {
    if (!data) return;
    fetch("/api/bff/engagement/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userHandle: viewerHandle, postId: data.post.id, type }),
    }).catch((err) => {
      console.error("[post] engagement toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });
  };

  const handleDeleted = (postId: string) => {
    setRemovedIds((prev) => new Set(prev).add(postId));
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || replyText.trim().length === 0 || replying) return;
    if (!viewerHandle) {
      showToast("You're logged out — log back in to reply", "error");
      return;
    }
    setReplying(true);
    try {
      const res = await fetch(`/api/bff/post/${data.post.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorHandle: viewerHandle, authorName: viewerName, text: replyText.trim() }),
      });
      if (!res.ok) {
        showToast("Couldn't post that reply — is the backend running?", "error");
        return;
      }
      const newReply: Post = await res.json();
      setData((prev) =>
        prev
          ? {
              post: { ...prev.post, stats: { ...prev.post.stats, replies: prev.post.stats.replies + 1 } },
              replies: [newReply, ...prev.replies],
            }
          : prev
      );
      setReplyText("");
      setReplyOpen(false);
      showToast("Reply posted", "success");
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setReplying(false);
    }
  };

  if (status === "notfound") {
    return (
      <>
        <section className={styles.column}>
          <TopBar title="Post" showBack />
          <div style={{ padding: 20 }}>
            <EmptyState title="This post doesn't exist" subtitle="It may have been deleted" />
          </div>
        </section>
        <aside style={{ width: "var(--rail-width)", flexShrink: 0 }} />
      </>
    );
  }

  const post = data?.post;
  const replies = (data?.replies ?? []).filter((r) => !removedIds.has(r.id));

  return (
    <>
      <section className={styles.column}>
        <TopBar title="Post" showBack />

        {status === "loading" && !post && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {status === "error" && !post && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={load} />
          </div>
        )}

        {post && (
          <>
            <div className={styles.focal}>
              <Link href={`/profile/${post.author.handle}`} className={styles.authorRow}>
                <Avatar name={post.author.name} size={48} />
                <div>
                  <div className={styles.authorName}>{post.author.name}</div>
                  <div className={styles.authorHandle}>@{post.author.handle}</div>
                </div>
              </Link>
              <p className={styles.focalText}>{post.text}</p>
              {post.hasMedia && (
                <div
                  style={{
                    height: post.mediaHeight ?? 220,
                    background: "var(--color-surface-elevated)",
                    borderRadius: "var(--radius-md)",
                    marginTop: 16,
                  }}
                />
              )}
              <div className={styles.timestamp}>{post.timestamp}</div>

              <div className={styles.statsRow}>
                <span>
                  <span className={styles.statValue}>{replies.length || post.stats.replies}</span> Replies
                </span>
                <span>
                  <span className={styles.statValue}>{reposts}</span> Reposts
                </span>
                <span>
                  <span className={styles.statValue}>{likes}</span> Likes
                </span>
              </div>

              <div className={styles.iconRow}>
                <button className={styles.iconBtn} aria-label="Reply" onClick={() => setReplyOpen(true)}>
                  <Icon name="reply" size={18} />
                </button>
                <button
                  className={styles.iconBtn}
                  aria-label="Repost"
                  onClick={() => {
                    const next = !reposted;
                    setReposted(next);
                    setReposts((c) => (reposted ? c - 1 : c + 1));
                    showToast(reposted ? "Repost removed" : "Reposted", "success");
                    persistEngagement("repost");
                  }}
                  style={reposted ? { color: "var(--color-success)" } : undefined}
                >
                  <Icon name="repost" size={18} />
                </button>
                <button
                  className={styles.iconBtn}
                  aria-label="Like"
                  onClick={() => {
                    const next = !liked;
                    setLiked(next);
                    setLikes((c) => (liked ? c - 1 : c + 1));
                    persistEngagement("like");
                  }}
                  style={{ color: liked ? "var(--color-destructive)" : undefined }}
                >
                  <Icon name={liked ? "like-filled" : "like"} size={18} />
                </button>
                <button
                  className={styles.iconBtn}
                  aria-label="Bookmark"
                  onClick={() => {
                    const next = !bookmarked;
                    setBookmarked(next);
                    showToast(bookmarked ? "Removed from Bookmarks" : "Added to Bookmarks", "success");
                    persistEngagement("bookmark");
                  }}
                  style={{ color: bookmarked ? "var(--color-accent)" : undefined }}
                >
                  <Icon name={bookmarked ? "bookmark-filled" : "bookmark"} size={18} />
                </button>
              </div>
            </div>

            <form className={styles.replyComposer} onSubmit={submitReply}>
              <Avatar name={viewerName} size={40} />
              {replyOpen ? (
                <div className={styles.replyExpanded}>
                  <textarea
                    ref={replyRef}
                    className={styles.replyTextarea}
                    placeholder={`Reply to @${post.author.handle}`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.replyFooter}>
                    <button
                      type="submit"
                      disabled={replyText.trim().length === 0 || replying}
                      style={{
                        background: replyText.trim().length === 0 || replying ? "var(--color-surface-hover)" : "var(--color-accent)",
                        color: replyText.trim().length === 0 || replying ? "var(--color-text-tertiary)" : "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "0 18px",
                        height: 36,
                        borderRadius: "var(--radius-pill)",
                        border: "none",
                      }}
                    >
                      {replying ? "Replying…" : "Reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.replyPrompt} onClick={() => setReplyOpen(true)}>
                  Post your reply
                </button>
              )}
            </form>

            {status === "ready" &&
              replies.map((reply) => <PostCard key={reply.id} post={reply} onDeleted={handleDeleted} />)}
          </>
        )}
      </section>
      <aside style={{ width: "var(--rail-width)", flexShrink: 0 }} />
    </>
  );
}

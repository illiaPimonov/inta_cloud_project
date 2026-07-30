"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import type { Post } from "@/lib/types";
import styles from "./PostCard.module.css";

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${n}`;
}

type EngagementType = "like" | "repost" | "bookmark";

interface PostCardProps {
  post: Post;
  bordered?: boolean;

  onEngagementToggle?: (type: EngagementType, nextActive: boolean) => void;

  onDeleted?: (postId: string) => void;
}

export default function PostCard({ post, bordered, onEngagementToggle, onDeleted }: PostCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.stats.likes);
  const [reposted, setReposted] = useState(!!post.reposted);
  const [reposts, setReposts] = useState(post.stats.reposts);
  const [bookmarked, setBookmarked] = useState(!!post.bookmarked);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const viewerHandle = getCurrentUserHandle();
  const isOwnPost = viewerHandle === post.author.handle;

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const goToPost = () => router.push(`/post/${post.id}`);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((c) => (liked ? c - 1 : c + 1));
    onEngagementToggle?.("like", next);
  };

  const toggleRepost = () => {
    const next = !reposted;
    setReposted(next);
    setReposts((c) => (reposted ? c - 1 : c + 1));
    showToast(reposted ? "Repost removed" : "Reposted", "success");
    onEngagementToggle?.("repost", next);
  };

  const toggleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    showToast(bookmarked ? "Removed from Bookmarks" : "Added to Bookmarks", "success");
    onEngagementToggle?.("bookmark", next);
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied", "success");
    } catch {
      showToast(url, "info");
    }
  };

  const copyLink = () => {
    setMenuOpen(false);
    share();
  };

  const deletePost = async () => {
    if (!viewerHandle || deleting) return;
    const confirmed = window.confirm("Delete this post? This can't be undone.");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bff/post/${post.id}?authorHandle=${encodeURIComponent(viewerHandle)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        showToast(data?.message ?? "Couldn't delete that post", "error");
        return;
      }
      setMenuOpen(false);
      showToast("Post deleted", "success");
      onDeleted?.(post.id);
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className={`${styles.card} ${bordered ? styles.bordered : ""}`}
      onClick={goToPost}
      role="link"
      tabIndex={0}
    >
      <Link href={`/profile/${post.author.handle}`} onClick={stop(() => {})}>
        <Avatar name={post.author.name} size={40} />
      </Link>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <Link
              href={`/profile/${post.author.handle}`}
              className={styles.name}
              onClick={stop(() => {})}
            >
              {post.author.name}
            </Link>
            <span className={styles.meta}>
              @{post.author.handle} · {post.timestamp}
            </span>
          </div>
          <div className={styles.moreWrap} ref={menuRef}>
            <button
              className={styles.more}
              onClick={stop(() => setMenuOpen((o) => !o))}
              aria-label="More"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Icon name="more" size={16} />
            </button>
            {menuOpen && (
              <div className={styles.moreMenu} role="menu" onClick={stop(() => {})}>
                <button className={styles.moreMenuItem} onClick={copyLink}>
                  <Icon name="link" size={16} />
                  Copy link
                </button>
                {isOwnPost && (
                  <button className={styles.moreMenuItemDanger} onClick={deletePost} disabled={deleting}>
                    <Icon name="close" size={16} />
                    {deleting ? "Deleting…" : "Delete post"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className={styles.text}>{post.text}</p>
        {post.hasMedia && <div className={styles.media} style={{ height: post.mediaHeight ?? 180 }} />}
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.replyHover}`}
            onClick={stop(goToPost)}
            aria-label="Reply"
          >
            <Icon name="reply" size={16} />
            {formatCount(post.stats.replies)}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.repostHover} ${reposted ? styles.bookmarkActive : ""}`}
            onClick={stop(toggleRepost)}
            aria-label="Repost"
            style={reposted ? { color: "var(--color-success)" } : undefined}
          >
            <Icon name="repost" size={16} />
            {formatCount(reposts)}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.likeHover} ${liked ? styles.active : ""}`}
            onClick={stop(toggleLike)}
            aria-label="Like"
          >
            <Icon name={liked ? "like-filled" : "like"} size={16} color={liked ? "var(--color-destructive)" : undefined} />
            {formatCount(likes)}
          </button>
          <button
            className={`${styles.actionBtn} ${bookmarked ? styles.bookmarkActive : ""}`}
            onClick={stop(toggleBookmark)}
            aria-label="Bookmark"
          >
            <Icon name={bookmarked ? "bookmark-filled" : "bookmark"} size={16} color={bookmarked ? "var(--color-accent)" : undefined} />
          </button>
          <button className={styles.actionBtn} onClick={stop(share)} aria-label="Share">
            <Icon name="share" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

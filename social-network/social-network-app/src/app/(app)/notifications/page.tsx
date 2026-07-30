"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";
import { EmptyState, EndOfList, ErrorState, LoadingSkeleton } from "@/components/States";
import { getCurrentUserHandle } from "@/lib/session";
import type { ServiceNotification } from "@/lib/services/types";
import styles from "./page.module.css";

const FILTER_TABS = ["All", "Mentions", "Follows"] as const;

const TYPE_ICON: Record<ServiceNotification["type"], IconName> = {
  like: "like-filled",
  follow: "follow",
  reply: "reply",
  repost: "repost",
  mention: "reply",
};

const TYPE_COLOR: Record<ServiceNotification["type"], string | undefined> = {
  like: "var(--color-destructive)",
  follow: "var(--color-text-secondary)",
  reply: "var(--color-text-secondary)",
  repost: "var(--color-success)",
  mention: "var(--color-text-secondary)",
};

function notificationLine(n: ServiceNotification) {
  const first = n.actors[0];
  const nameEl = <b key="n">{first?.name ?? "Someone"}</b>;
  switch (n.type) {
    case "like":
      return n.extraCount ? (
        <>
          {nameEl} and {n.extraCount} others liked your post
        </>
      ) : (
        <>{nameEl} liked your post</>
      );
    case "follow":
      return <>{nameEl} followed you</>;
    case "reply":
      return <>{nameEl} replied to your post</>;
    case "repost":
      return <>{nameEl} reposted your post</>;
    case "mention":
      return <>{nameEl} mentioned you</>;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>("All");
  const [items, setItems] = useState<ServiceNotification[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  const userHandle = getCurrentUserHandle();

  const load = () => {
    setStatus("loading");
    fetch(`/api/bff/notifications?userHandle=${encodeURIComponent(userHandle ?? "")}`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: ServiceNotification[]) => {
        setItems(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[notifications] failed to load", err);
        setStatus("error");
      });
  };

  useEffect(load, [userHandle]);

  const filtered = items.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Mentions") return n.type === "reply" || n.type === "mention";
    if (filter === "Follows") return n.type === "follow";
    return true;
  });

  const handleOpen = (n: ServiceNotification) => {
    if (n.unread) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, unread: false } : i)));
      fetch(`/api/bff/notifications/${n.id}/read`, { method: "PATCH" }).catch((err) =>
        console.error("[notifications] mark-as-read failed to persist", err)
      );
    }

    const actor = n.actors[0];
    if (actor) router.push(`/profile/${actor.handle}`);
  };

  return (
    <>
      <section className={styles.column}>
        <div className={styles.header}>
          <div className={styles.tabsInline}>
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                className={`${styles.tabInline} ${t === filter ? styles.active : ""}`}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <Link href="/settings" className={styles.gearBtn} aria-label="Notification settings">
            <Icon name="settings" size={18} />
          </Link>
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

        {status === "ready" && filtered.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState title="Nothing here yet" subtitle="Notifications will show up here" />
          </div>
        )}

        {status === "ready" &&
          filtered.map((n) => (
            <div
              key={n.id}
              className={`${styles.item} ${n.unread ? styles.unread : ""}`}
              onClick={() => handleOpen(n)}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.stack}>
                {n.actors.slice(0, 2).map((actor, i) => (
                  <div key={actor.handle + i} className={styles.stackAvatar} style={{ width: 28, height: 28 }} />
                ))}
              </div>
              <div className={styles.body}>
                <div className={styles.line}>
                  <Icon name={TYPE_ICON[n.type]} size={16} color={TYPE_COLOR[n.type]} />
                  {notificationLine(n)}
                </div>
                {n.postExcerpt && <div className={styles.excerpt}>{n.postExcerpt}</div>}
              </div>
              {n.unread && <span className={styles.dot} />}
            </div>
          ))}

        {status === "ready" && <EndOfList />}
      </section>
      <aside style={{ width: "var(--rail-width)", flexShrink: 0 }} />
    </>
  );
}

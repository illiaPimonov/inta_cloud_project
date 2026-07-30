"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import SearchBox from "./SearchBox";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import { trends as mockTrends, whoToFollow, youMightLike } from "@/lib/mockData";
import type { Trend, User } from "@/lib/types";
import styles from "./RightRail.module.css";

interface RightRailProps {

  trends?: Trend[];

  suggestions?: User[];
}

export default function RightRail({ trends, suggestions }: RightRailProps) {
  const { showToast } = useToast();
  const viewerHandle = getCurrentUserHandle();
  const trendList = trends ?? mockTrends;
  const [firstSuggestion, ...restSuggestions] = suggestions ?? [...whoToFollow, ...youMightLike];

  const persistFollow = (targetHandle: string) => {
    if (!viewerHandle) return;
    fetch("/api/bff/follow/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerHandle, targetHandle }),
    }).catch((err) => {
      console.error("[right-rail] follow toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });
  };

  return (
    <aside className={styles.rail}>
      <SearchBox />

      <div className={styles.card}>
        <div className={styles.cardTitle}>Trends for you</div>
        {trendList.map((t) => (
          <div className={styles.trendItem} key={t.tag}>
            <span className={styles.trendCategory}>{t.category}</span>
            <span className={styles.trendTag}>{t.tag}</span>
            <span className={styles.trendCount}>{t.postCount}</span>
          </div>
        ))}
      </div>

      {firstSuggestion && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Who to follow</div>
          <div className={styles.suggestRow}>
            <Link href={`/profile/${firstSuggestion.handle}`}>
              <Avatar name={firstSuggestion.name} size={36} />
            </Link>
            <div className={styles.suggestInfo}>
              <div className={styles.suggestName}>{firstSuggestion.name}</div>
              <div className={styles.suggestHandle}>@{firstSuggestion.handle}</div>
            </div>
            <FollowButton
              initiallyFollowing={firstSuggestion.isFollowing}
              onChange={() => persistFollow(firstSuggestion.handle)}
            />
          </div>
          <Link href="/follow" className={styles.showMore}>
            Show more
          </Link>
        </div>
      )}

      {restSuggestions.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>You might like</div>
          <div className={styles.subtitle}>Based on people you follow</div>
          {restSuggestions.map((u) => (
            <div className={styles.suggestRow} key={u.id}>
              <Link href={`/profile/${u.handle}`}>
                <Avatar name={u.name} size={36} />
              </Link>
              <div className={styles.suggestInfo}>
                <div className={styles.suggestName}>{u.name}</div>
                <div className={styles.suggestHandle}>@{u.handle}</div>
              </div>
              <FollowButton initiallyFollowing={u.isFollowing} onChange={() => persistFollow(u.handle)} />
            </div>
          ))}
          <Link href="/follow" className={styles.showMore}>
            Show more
          </Link>
        </div>
      )}
    </aside>
  );
}

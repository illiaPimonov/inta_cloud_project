"use client";

import { useState } from "react";
import styles from "./FollowButton.module.css";

interface FollowButtonProps {
  initiallyFollowing?: boolean;
  onChange?: (following: boolean) => void;
}

export default function FollowButton({
  initiallyFollowing = false,
  onChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [hovering, setHovering] = useState(false);

  const toggle = () => {
    const next = !following;
    setFollowing(next);
    setHovering(false);
    onChange?.(next);
  };

  const label = following ? (hovering ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      type="button"
      className={`${styles.btn} ${following ? styles.following : styles.follow}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={toggle}
    >
      {label}
    </button>
  );
}

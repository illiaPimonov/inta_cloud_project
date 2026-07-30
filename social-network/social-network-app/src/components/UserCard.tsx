import Link from "next/link";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import type { User } from "@/lib/types";
import styles from "./UserCard.module.css";

interface UserCardProps {
  user: User;
  size?: 36 | 40 | 44 | 48;
  showBio?: boolean;
  padded?: boolean;
  onFollowChange?: (handle: string, following: boolean) => void;
}

export default function UserCard({ user, size = 48, showBio = false, padded = true, onFollowChange }: UserCardProps) {
  return (
    <div className={`${styles.card} ${padded ? styles.padded : ""}`}>
      <Link href={`/profile/${user.handle}`}>
        <Avatar name={user.name} size={size} />
      </Link>
      <div className={styles.info}>
        <Link href={`/profile/${user.handle}`} className={styles.name}>
          {user.name}
        </Link>
        <div className={styles.handle}>@{user.handle}</div>
        {showBio && user.bio && <div className={styles.bio}>{user.bio}</div>}
      </div>
      <FollowButton
        initiallyFollowing={user.isFollowing}
        onChange={(following) => onFollowChange?.(user.handle, following)}
      />
    </div>
  );
}

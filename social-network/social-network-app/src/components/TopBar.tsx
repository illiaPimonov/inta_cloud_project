"use client";

import { useRouter } from "next/navigation";
import Icon from "./Icon";
import styles from "./TopBar.module.css";

export default function TopBar({
  title,
  showBack,
  trailing,
  children,
}: {
  title?: string;
  showBack?: boolean;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className={styles.bar}>
      {showBack && (
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <Icon name="back" size={20} />
        </button>
      )}
      {title && <div className={styles.title}>{title}</div>}
      {children}
      <div className={styles.spacer} />
      {trailing}
    </div>
  );
}

import Button from "./Button";
import styles from "./States.module.css";

export function EmptyState({
  title = "Nothing here yet",
  subtitle = "Posts you like will show up here",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.icon} />
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className={styles.container}>
      <div className={styles.errorMark}>!</div>
      <div className={styles.title}>Something went wrong</div>
      <div className={styles.subtitle}>Check your connection and try again</div>
      <Button size="sm" className={styles.retry} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className={styles.container} style={{ alignItems: "stretch", gap: 10 }}>
      <div className={styles.skeletonRow}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonLine} />
      </div>
      <div className={styles.skeletonLine} style={{ width: "90%" }} />
      <div className={styles.skeletonLine} style={{ width: "60%" }} />
    </div>
  );
}

export function EndOfList({ text = "You're all caught up" }: { text?: string }) {
  return (
    <div className={styles.endMarker}>
      <div className={styles.spinner} style={{ animation: "none", borderTopColor: "var(--color-border)" }} />
      <div className={styles.endText}>{text}</div>
    </div>
  );
}

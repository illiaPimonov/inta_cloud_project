import styles from "./Avatar.module.css";

interface AvatarProps {
  name?: string;
  size?: 28 | 32 | 36 | 40 | 44 | 48 | 56 | 72 | 88;
  border?: boolean;
}

export default function Avatar({ name, size = 40, border }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.35),
        border: border ? "4px solid var(--color-surface)" : undefined,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

import Icon from "./Icon";
import styles from "./AuthShell.module.css";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.brand}>
        <Icon name="logo" size={36} color="var(--color-destructive)" />
        <div className={styles.brandTitle}>{title}</div>
        <div className={styles.brandSubtitle}>{subtitle}</div>
      </div>
      <div className={styles.formSide}>{children}</div>
    </div>
  );
}

"use client";

import { useToastStore } from "./toastStore";
import styles from "./ToastViewport.module.css";

export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          <span
            className={styles.dot}
            style={{
              color:
                t.variant === "success"
                  ? "var(--color-success)"
                  : t.variant === "error"
                  ? "var(--color-destructive)"
                  : "var(--color-accent)",
            }}
          >
            ●
          </span>
          <span>{t.message}</span>
          {t.actionLabel && (
            <button className={styles.action} onClick={t.onAction}>
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

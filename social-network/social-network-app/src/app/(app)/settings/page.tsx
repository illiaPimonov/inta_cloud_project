"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle, getCurrentUserName, logout, setCurrentUser } from "@/lib/session";
import { settingsAccountSchema, getFieldErrors } from "@/lib/validation";
import styles from "./page.module.css";

const CATEGORIES = ["Account", "Security", "Notifications", "Privacy", "Appearance", "Accessibility"] as const;
type Category = (typeof CATEGORIES)[number];

const TOGGLES_KEY = "sn_settings_toggles";

interface ToggleDef {
  id: string;
  label: string;
  subtitle: string;
  defaultOn: boolean;
}

const TOGGLE_GROUPS: Record<Exclude<Category, "Account" | "Appearance">, ToggleDef[]> = {
  Security: [
    { id: "twoFactor", label: "Two-factor authentication", subtitle: "Require a code in addition to your password", defaultOn: false },
    { id: "loginAlerts", label: "Login alerts", subtitle: "Get notified about logins from new devices", defaultOn: true },
    { id: "sensitiveConfirm", label: "Confirm before viewing sensitive content", subtitle: "Add a warning screen for flagged media", defaultOn: true },
  ],
  Notifications: [
    { id: "pushNotifs", label: "Push notifications", subtitle: "Likes, replies, reposts, and follows", defaultOn: true },
    { id: "emailNotifs", label: "Email notifications", subtitle: "Weekly digest and important account emails", defaultOn: false },
    { id: "mentionsOnly", label: "Only notify me for mentions", subtitle: "Mute everything except direct mentions", defaultOn: false },
  ],
  Privacy: [
    { id: "privateAccount", label: "Private account", subtitle: "Only approved followers can see your posts", defaultOn: false },
    { id: "messageRequests", label: "Allow message requests from everyone", subtitle: "Otherwise only people you follow can message you", defaultOn: true },
    { id: "showActivity", label: "Show activity status", subtitle: "Let others see when you're active", defaultOn: true },
  ],
  Accessibility: [
    { id: "reduceMotion", label: "Reduce motion", subtitle: "Minimize animations across the app", defaultOn: false },
    { id: "highContrast", label: "High contrast", subtitle: "Increase contrast between text and background", defaultOn: false },
    { id: "largerText", label: "Larger text", subtitle: "Increase the base font size", defaultOn: false },
  ],
};

function loadToggles(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TOGGLES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToggles(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOGGLES_KEY, JSON.stringify(map));
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.switch} ${on ? styles.switchOn : ""}`}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [category, setCategory] = useState<Category>("Account");
  const [displayName, setDisplayName] = useState(getCurrentUserName());
  const [username, setUsername] = useState(getCurrentUserHandle() ?? "");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState({ displayName, username, email });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const currentHandle = getCurrentUserHandle();

  useEffect(() => {
    setToggles(loadToggles());
  }, []);

  useEffect(() => {
    if (!currentHandle) return;
    fetch(`/api/bff/settings/account?handle=${encodeURIComponent(currentHandle)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { name: string; handle: string; email: string } | null) => {
        if (!data) return;
        setDisplayName(data.name);
        setUsername(data.handle);
        setEmail(data.email);
        setSaved({ displayName: data.name, username: data.handle, email: data.email });
      })
      .catch((err) => console.error("[settings] failed to load account", err));

  }, [currentHandle]);

  const dirty =
    category === "Account" &&
    (displayName !== saved.displayName || username !== saved.username || email !== saved.email);

  const handleSave = async () => {
    const errors = getFieldErrors(settingsAccountSchema, { displayName, username, email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!currentHandle) {
      showToast("You're logged out — log back in to save changes", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bff/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentHandle, displayName, username, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setFieldErrors((prev) => ({ ...prev, username: data.message }));
        else showToast(data.message ?? "Couldn't save changes", "error");
        return;
      }
      setSaved({ displayName, username, email });
      setCurrentUser(username, displayName);
      showToast("Changes saved", "success");
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(saved.displayName);
    setUsername(saved.username);
    setEmail(saved.email);
    setFieldErrors({});
  };

  const handleDeactivate = async () => {
    if (!currentHandle || deactivating) return;
    const confirmed = window.confirm("Deactivate your account? You'll be logged out immediately.");
    if (!confirmed) return;
    setDeactivating(true);
    try {
      const res = await fetch("/api/bff/settings/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: currentHandle }),
      });
      if (!res.ok) {
        showToast("Couldn't deactivate — is the backend running?", "error");
        return;
      }
      logout();
      showToast("Account deactivated", "info");
      router.push("/login");
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setDeactivating(false);
    }
  };

  const toggleValue = (t: ToggleDef) => toggles[t.id] ?? t.defaultOn;

  const flipToggle = (t: ToggleDef) => {
    setToggles((prev) => {
      const next = { ...prev, [t.id]: !toggleValue(t) };
      saveToggles(next);
      return next;
    });
  };

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Settings</div>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`${styles.navItem} ${c === category ? styles.active : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <div className={styles.panel}>
        <div className={styles.panelTitle}>{category}</div>

        {category === "Account" && (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Display name</label>
              <input
                className={`${styles.fieldValue} ${fieldErrors.displayName ? styles.fieldError : ""}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {fieldErrors.displayName && <span className={styles.fieldErrorText}>{fieldErrors.displayName}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Username</label>
              <input
                className={`${styles.fieldValue} ${fieldErrors.username ? styles.fieldError : ""}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {fieldErrors.username && <span className={styles.fieldErrorText}>{fieldErrors.username}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                className={`${styles.fieldValue} ${fieldErrors.email ? styles.fieldError : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <span className={styles.fieldErrorText}>{fieldErrors.email}</span>}
            </div>

            <div className={styles.divider} />

            <div className={styles.dangerZone}>
              <div className={styles.dangerTitle}>Deactivate account</div>
              <div className={styles.dangerSubtitle}>
                Your account will be deactivated and hidden until you log back in.
              </div>
              <button className={styles.dangerBtn} onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? "Deactivating…" : "Deactivate account"}
              </button>
            </div>
          </>
        )}

        {category === "Appearance" && (
          <div className={styles.placeholder}>This kit ships in dark mode only — light mode isn&apos;t part of this design.</div>
        )}

        {category !== "Account" && category !== "Appearance" && (
          <div className={styles.toggleList}>
            {TOGGLE_GROUPS[category].map((t) => (
              <div key={t.id} className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>{t.label}</div>
                  <div className={styles.toggleSubtitle}>{t.subtitle}</div>
                </div>
                <Switch on={toggleValue(t)} onToggle={() => flipToggle(t)} />
              </div>
            ))}
          </div>
        )}

        {dirty && (
          <div className={styles.saveBar}>
            <span className={styles.saveBarText}>You have unsaved changes</span>
            <div className={styles.saveBarActions}>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

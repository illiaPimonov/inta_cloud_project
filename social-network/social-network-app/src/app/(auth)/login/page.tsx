"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import { loginSchema, getFieldErrors } from "@/lib/validation";
import { setCurrentUser } from "@/lib/session";
import styles from "@/components/AuthShell.module.css";

const MOCK_EMAIL = "jordan@site.com";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-sent">("login");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getFieldErrors(loginSchema, { identifier, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAuthError("");
    setSubmitting(true);
    try {

      const res = await fetch("/api/bff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message ?? "Incorrect username or password");
        return;
      }

      setCurrentUser(data.handle, data.name);
      router.push("/home");
    } catch {
      setAuthError("Can't reach the backend — is docker compose running?");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setResetError("Enter a valid email");
      return;
    }
    setResetError("");

    setMode("forgot-sent");
  };

  if (mode !== "login") {
    return (
      <AuthShell
        title="See what's happening, right now."
        subtitle="Join the conversation with people who share your interests."
      >
        <div className={styles.form}>
          <div className={styles.formTitle}>Reset your password</div>
          {mode === "forgot" ? (
            <form
              onSubmit={handleResetSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <FormField
                label="Email"
                type="email"
                placeholder="jordan@site.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                error={resetError}
                helper="We'll send a reset link if an account exists for this email."
              />
              <Button type="submit" size="lg">
                Send reset link
              </Button>
            </form>
          ) : (
            <div className={styles.errorBanner} style={{ background: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
              If an account exists for {resetEmail}, we&apos;ve sent a link to reset the password.
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setResetEmail("");
              setResetError("");
            }}
            className={styles.footerLink}
            style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer" }}
          >
            ← Back to log in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="See what's happening, right now."
      subtitle="Join the conversation with people who share your interests."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formTitle}>Log in</div>
        {authError && <div className={styles.errorBanner}>{authError}</div>}
        <FormField
          label="Email or username"
          placeholder="jordan@site.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
          helper={!fieldErrors.identifier ? `Demo: ${MOCK_EMAIL} / any password` : undefined}
        />
        <FormField
          label="Password"
          placeholder="••••••••"
          isPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          rightLink={{ label: "Forgot password?", onClick: () => setMode("forgot") }}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
        <div className={styles.orDivider}>or</div>
        <div className={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.footerLink}>
            Sign up
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

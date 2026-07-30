"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import { registerSchema, getFieldErrors, passwordStrength } from "@/lib/validation";
import { setCurrentUser } from "@/lib/session";
import styles from "@/components/AuthShell.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usernameCheck = useMemo(() => {
    if (username.length === 0) return null;
    const errors = getFieldErrors(registerSchema.pick({ username: true }), { username });
    return errors.username ? { available: false, message: errors.username } : { available: true };
  }, [username]);

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getFieldErrors(registerSchema, { displayName, username, email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bff/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setFieldErrors((prev) => ({ ...prev, username: data.message ?? "Username already taken" }));
        } else {
          setFormError(data.message ?? "Something went wrong");
        }
        return;
      }

      setCurrentUser(data.handle, data.name);
      router.push("/home");
    } catch {
      setFormError("Can't reach the backend — is docker compose running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your account." subtitle="It only takes a minute.">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formTitle}>Sign up</div>
        {formError && <div className={styles.errorBanner}>{formError}</div>}
        <FormField
          label="Display name"
          placeholder="Jordan Kim"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <FormField
          label="Username"
          placeholder="jordankim"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
          success={usernameCheck?.available ? "✓ looks available" : undefined}
          error={fieldErrors.username ?? (usernameCheck && !usernameCheck.available ? usernameCheck.message : undefined)}
        />
        <FormField
          label="Email"
          type="email"
          placeholder="jordan@site.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <div>
          <FormField
            label="Password"
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          {password.length > 0 && (
            <div className={styles.strengthRow} style={{ marginTop: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={styles.strengthBar}
                  style={{
                    background:
                      i < strength
                        ? strength === 1
                          ? "var(--color-destructive)"
                          : strength === 2
                          ? "#e0b84f"
                          : "var(--color-success)"
                        : "var(--color-border)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles.fine}>
          By signing up, you agree to the Terms of Service and Privacy Policy.
        </div>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
        <div className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className={styles.footerLink}>
            Log in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

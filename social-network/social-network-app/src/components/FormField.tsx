"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";
import styles from "./FormField.module.css";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  helper?: string;
  rightLink?: { label: string; onClick: () => void };
  isPassword?: boolean;
}

export default function FormField({
  label,
  error,
  success,
  helper,
  rightLink,
  isPassword,
  type,
  ...rest
}: FormFieldProps) {
  const [show, setShow] = useState(false);
  const resolvedType = isPassword ? (show ? "text" : "password") : type ?? "text";

  const stateClass = error ? styles.error : success ? styles.success : "";

  return (
    <div className={`${styles.field} ${stateClass}`}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {rightLink && (
          <button type="button" className={styles.link} onClick={rightLink.onClick}>
            {rightLink.label}
          </button>
        )}
      </div>
      <div className={styles.inputWrap}>
        <input className={styles.input} type={resolvedType} {...rest} />
        {isPassword && (
          <button
            type="button"
            className={styles.suffix}
            onClick={() => setShow((s) => !s)}
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
        {success && !isPassword && <span className={styles.successText}>{success}</span>}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  );
}

export function FormFieldWrapper({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

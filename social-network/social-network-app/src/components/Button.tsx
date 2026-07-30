import { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    disabled ? styles.disabled : styles[variant],
    size === "sm" ? styles.sm : size === "lg" ? styles.lg : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} disabled={disabled} {...rest} />;
}

import { z } from "zod";

export const TAKEN_USERNAMES = new Set([
  "priyanair",
  "devpatel",
  "alexchen",
  "mayatorres",
  "samosei",
  "rinaito",
  "admin",
]);

const usernameField = z
  .string()
  .min(3, "Too short")
  .max(15, "Too long")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(50, "Too long"),
  username: usernameField.refine((v) => !TAKEN_USERNAMES.has(v.toLowerCase()), {
    message: "Already taken",
  }),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const settingsAccountSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(50, "Too long"),
  username: usernameField,
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
export type SettingsAccountInput = z.infer<typeof settingsAccountSchema>;

export function getFieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  values: z.input<T>
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

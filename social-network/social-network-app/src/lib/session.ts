"use client";

const HANDLE_KEY = "sn_current_user_handle";
const NAME_KEY = "sn_current_user_name";
const LOGGED_OUT_KEY = "sn_logged_out";
const DEFAULT_HANDLE = "jordankim";
const DEFAULT_NAME = "Jordan Kim";

export function getCurrentUserHandle(): string | null {
  if (typeof window === "undefined") return DEFAULT_HANDLE;
  const stored = window.localStorage.getItem(HANDLE_KEY);
  if (stored) return stored;
  if (window.localStorage.getItem(LOGGED_OUT_KEY) === "1") return null;
  return DEFAULT_HANDLE;
}

export function getCurrentUserName(): string {
  if (typeof window === "undefined") return DEFAULT_NAME;
  return window.localStorage.getItem(NAME_KEY) || DEFAULT_NAME;
}

export function setCurrentUserHandle(handle: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HANDLE_KEY, handle);
  window.localStorage.removeItem(LOGGED_OUT_KEY);
}

export function setCurrentUser(handle: string, name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HANDLE_KEY, handle);
  window.localStorage.setItem(NAME_KEY, name);
  window.localStorage.removeItem(LOGGED_OUT_KEY);
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HANDLE_KEY);
  window.localStorage.removeItem(NAME_KEY);
  window.localStorage.setItem(LOGGED_OUT_KEY, "1");
}

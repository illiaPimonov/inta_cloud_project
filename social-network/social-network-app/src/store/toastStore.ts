"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (
    message: string,
    variant?: ToastVariant,
    action?: { label: string; onAction: () => void }
  ) => void;
  dismissToast: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, variant = "info", action) => {
    const id = ++nextId;
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, message, variant, actionLabel: action?.label, onAction: action?.onAction },
      ],
    }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, 4000);
    }
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const showToast = useToastStore((s) => s.showToast);
  return { showToast };
}

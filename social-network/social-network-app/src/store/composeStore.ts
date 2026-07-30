"use client";

import { create } from "zustand";

interface ComposeState {
  isOpen: boolean;

  postVersion: number;
  openCompose: () => void;
  closeCompose: (posted?: boolean) => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  isOpen: false,
  postVersion: 0,
  openCompose: () => set({ isOpen: true }),
  closeCompose: (posted) =>
    set((state) => ({
      isOpen: false,
      postVersion: posted ? state.postVersion + 1 : state.postVersion,
    })),
}));

export function useCompose() {
  const isOpen = useComposeStore((s) => s.isOpen);
  const postVersion = useComposeStore((s) => s.postVersion);
  const openCompose = useComposeStore((s) => s.openCompose);
  const closeCompose = useComposeStore((s) => s.closeCompose);
  return { isOpen, postVersion, openCompose, closeCompose };
}

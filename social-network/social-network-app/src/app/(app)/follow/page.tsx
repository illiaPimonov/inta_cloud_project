"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Tabs from "@/components/Tabs";
import UserCard from "@/components/UserCard";
import { EmptyState, EndOfList, ErrorState, LoadingSkeleton } from "@/components/States";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle } from "@/lib/session";
import type { User } from "@/lib/types";

const TABS = ["For you", "Based on interests"];

export default function FollowPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("For you");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  const userHandle = getCurrentUserHandle();

  const load = () => {
    setStatus("loading");
    fetch(`/api/bff/follow-suggestions?userHandle=${encodeURIComponent(userHandle ?? "")}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error(`BFF responded ${res.status}`);
        return res.json();
      })
      .then((data: User[]) => {
        setSuggestions(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[follow] failed to load suggestions", err);
        setStatus("error");
      });
  };

  useEffect(load, [userHandle]);

  const list = suggestions;

  const handleFollowChange = (targetHandle: string, following: boolean) => {
    if (!userHandle) return;
    fetch("/api/bff/follow/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerHandle: userHandle, targetHandle }),
    }).catch((err) => {
      console.error("[follow] toggle failed to persist", err);
      showToast("Couldn't save that — check the backend connection", "error");
    });
  };

  return (
    <>
      <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar title="Follow suggestions" />
        <Tabs tabs={TABS} active={tab} onChange={setTab} height={52} />

        {status === "loading" && (
          <div style={{ padding: 20 }}>
            <LoadingSkeleton />
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: 20 }}>
            <ErrorState onRetry={load} />
          </div>
        )}

        {status === "ready" && list.length === 0 && (
          <div style={{ padding: 20 }}>
            <EmptyState title="No suggestions right now" subtitle="Check back later" />
          </div>
        )}

        {status === "ready" &&
          list.map((u) => (
            <UserCard key={u.id} user={u} showBio size={48} onFollowChange={handleFollowChange} />
          ))}

        {status === "ready" && list.length > 0 && <EndOfList />}
      </section>
      <aside style={{ width: "var(--rail-width)", flexShrink: 0 }} />
    </>
  );
}

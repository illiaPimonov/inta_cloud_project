"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserHandle } from "@/lib/session";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getCurrentUserHandle() === null) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}

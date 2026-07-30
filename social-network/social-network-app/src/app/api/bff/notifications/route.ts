import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import type { ServiceNotification } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const notifications = await callService<ServiceNotification[]>(
      "notifications",
      `/notifications?userHandle=${encodeURIComponent(userHandle)}`
    );
    return NextResponse.json(notifications);
  } catch (err) {
    console.error("[bff] notifications fetch failed", err);
    return NextResponse.json({ message: "notifications-service is unreachable" }, { status: 502 });
  }
}

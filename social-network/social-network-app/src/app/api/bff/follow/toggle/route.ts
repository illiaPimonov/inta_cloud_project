import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const viewerHandle = typeof body?.viewerHandle === "string" ? body.viewerHandle : "";
  const targetHandle = typeof body?.targetHandle === "string" ? body.targetHandle : "";

  if (!viewerHandle || !targetHandle) {
    return NextResponse.json({ message: "viewerHandle and targetHandle are required" }, { status: 400 });
  }

  try {
    const result = await callService<{ following: boolean }>("users", "/users/follow", {
      method: "POST",
      body: JSON.stringify({ viewerHandle, targetHandle }),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[bff] follow toggle failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}

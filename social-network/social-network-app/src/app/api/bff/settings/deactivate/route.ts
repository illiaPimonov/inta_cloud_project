import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === "string" ? body.handle : "";

  if (!handle) {
    return NextResponse.json({ message: "handle is required" }, { status: 400 });
  }

  try {
    const result = await callService("users", `/users/${encodeURIComponent(handle)}/deactivate`, { method: "POST" });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[bff] deactivate failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}

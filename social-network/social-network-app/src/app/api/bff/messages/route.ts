import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import type { ServiceConversationSummary } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const conversations = await callService<ServiceConversationSummary[]>(
      "messages",
      `/conversations?userHandle=${encodeURIComponent(userHandle)}`
    );
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[bff] messages list failed", err);
    return NextResponse.json({ message: "messages-service is unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initiatorHandle = typeof body?.initiatorHandle === "string" ? body.initiatorHandle : "";
  const initiatorName = typeof body?.initiatorName === "string" ? body.initiatorName : "";
  const recipientHandle = typeof body?.recipientHandle === "string" ? body.recipientHandle : "";
  const recipientName = typeof body?.recipientName === "string" ? body.recipientName : "";

  if (!initiatorHandle || !initiatorName || !recipientHandle || !recipientName) {
    return NextResponse.json(
      { message: "initiatorHandle, initiatorName, recipientHandle and recipientName are required" },
      { status: 400 }
    );
  }

  try {
    const conversation = await callService<{ id: string }>("messages", "/conversations", {
      method: "POST",
      body: JSON.stringify({ initiatorHandle, initiatorName, recipientHandle, recipientName }),
    });
    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("[bff] start conversation failed", err);
    return NextResponse.json({ message: "messages-service is unreachable" }, { status: 502 });
  }
}

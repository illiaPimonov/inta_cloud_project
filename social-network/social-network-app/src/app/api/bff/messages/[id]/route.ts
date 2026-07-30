import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import type { ServiceMessage } from "@/lib/services/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const messages = await callService<ServiceMessage[]>(
      "messages",
      `/conversations/${params.id}/messages?userHandle=${encodeURIComponent(userHandle)}`
    );
    return NextResponse.json(messages);
  } catch (err) {
    console.error("[bff] thread fetch failed", err);
    return NextResponse.json({ message: "messages-service is unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const fromHandle = typeof body?.fromHandle === "string" ? body.fromHandle : "";
  const text = typeof body?.text === "string" ? body.text : "";

  if (!fromHandle || !text.trim()) {
    return NextResponse.json({ message: "fromHandle and text are required" }, { status: 400 });
  }

  try {
    const message = await callService<ServiceMessage>("messages", `/conversations/${params.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ fromHandle, text }),
    });
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("[bff] send message failed", err);
    return NextResponse.json({ message: "messages-service is unreachable" }, { status: 502 });
  }
}

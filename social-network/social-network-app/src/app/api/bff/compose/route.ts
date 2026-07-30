import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import { toFrontendPost } from "@/lib/services/mappers";
import type { ServicePost } from "@/lib/services/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const authorHandle = typeof body?.authorHandle === "string" ? body.authorHandle : "";
  const authorName = typeof body?.authorName === "string" ? body.authorName : "";
  const text = typeof body?.text === "string" ? body.text : "";
  const hasMedia = Boolean(body?.hasMedia);
  const replyToPostId = typeof body?.replyToPostId === "string" ? body.replyToPostId : "";

  if (!authorHandle || !authorName || !text.trim()) {
    return NextResponse.json({ message: "authorHandle, authorName and text are required" }, { status: 400 });
  }

  try {
    const path = replyToPostId ? `/posts/${replyToPostId}/replies` : "/posts";
    const post = await callService<ServicePost>("posts", path, {
      method: "POST",
      body: JSON.stringify({ authorHandle, authorName, text, hasMedia }),
    });
    return NextResponse.json(toFrontendPost(post), { status: 201 });
  } catch (err) {
    console.error("[bff] compose post failed", err);
    return NextResponse.json({ message: "posts-service is unreachable" }, { status: 502 });
  }
}

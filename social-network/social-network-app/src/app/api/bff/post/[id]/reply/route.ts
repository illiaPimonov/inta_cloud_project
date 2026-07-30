import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import { toFrontendPost } from "@/lib/services/mappers";
import type { ServicePost } from "@/lib/services/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const authorHandle = typeof body?.authorHandle === "string" ? body.authorHandle : "";
  const authorName = typeof body?.authorName === "string" ? body.authorName : "";
  const text = typeof body?.text === "string" ? body.text : "";

  if (!authorHandle || !authorName || !text.trim()) {
    return NextResponse.json({ message: "authorHandle, authorName and text are required" }, { status: 400 });
  }

  try {
    const parent = await callService<ServicePost>("posts", `/posts/${params.id}`);
    const reply = await callService<ServicePost>("posts", `/posts/${params.id}/replies`, {
      method: "POST",
      body: JSON.stringify({ authorHandle, authorName, text }),
    });

    callService("notifications", "/notifications", {
      method: "POST",
      body: JSON.stringify({
        recipientHandle: parent.authorHandle,
        type: "reply",
        actorHandle: authorHandle,
        actorName: authorName,
        postExcerpt: `"${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`,
      }),
    }).catch((err) => console.error("[bff] reply notification failed (non-fatal)", err));

    return NextResponse.json(toFrontendPost(reply), { status: 201 });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    console.error("[bff] reply failed", err);
    return NextResponse.json({ message: "posts-service is unreachable" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import type { ServicePost } from "@/lib/services/types";

type ToggleType = "like" | "repost" | "bookmark";

const COUNTER_FIELD: Partial<Record<ToggleType, "likes" | "reposts">> = {
  like: "likes",
  repost: "reposts",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userHandle = typeof body?.userHandle === "string" ? body.userHandle : "";
  const actorName = typeof body?.actorName === "string" ? body.actorName : userHandle;
  const postId = typeof body?.postId === "string" ? body.postId : "";
  const type = body?.type as ToggleType;

  if (!userHandle || !postId || !type) {
    return NextResponse.json({ message: "userHandle, postId and type are required" }, { status: 400 });
  }

  try {
    const result = await callService<{ active: boolean }>("engagement", "/engagement/toggle", {
      method: "POST",
      body: JSON.stringify({ userHandle, postId, type }),
    });

    const counterField = COUNTER_FIELD[type];
    if (counterField) {
      await callService("posts", `/posts/${postId}/counters`, {
        method: "PATCH",
        body: JSON.stringify({ field: counterField, delta: result.active ? 1 : -1 }),
      });
    }

    if (result.active && (type === "like" || type === "repost")) {
      callService<ServicePost>("posts", `/posts/${postId}`)
        .then((post) =>
          callService("notifications", "/notifications", {
            method: "POST",
            body: JSON.stringify({
              recipientHandle: post.authorHandle,
              type,
              actorHandle: userHandle,
              actorName,
              postExcerpt: `"${post.text.slice(0, 80)}${post.text.length > 80 ? "…" : ""}"`,
            }),
          })
        )
        .catch((err) => console.error("[bff] engagement notification failed (non-fatal)", err));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[bff] engagement toggle failed", err);
    return NextResponse.json({ message: "engagement-service or posts-service is unreachable" }, { status: 502 });
  }
}

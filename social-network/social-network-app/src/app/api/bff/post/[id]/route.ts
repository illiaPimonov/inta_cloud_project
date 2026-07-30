import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import { toFrontendPost, toFrontendPosts } from "@/lib/services/mappers";
import type { EngagementStateMap, ServicePost } from "@/lib/services/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const [post, replies] = await Promise.all([
      callService<ServicePost>("posts", `/posts/${params.id}`),
      callService<ServicePost[]>("posts", `/posts/${params.id}/replies`),
    ]);

    const allIds = [post.id, ...replies.map((r) => r.id)].join(",");
    const engagement = await callService<EngagementStateMap>(
      "engagement",
      `/engagement/state?userHandle=${encodeURIComponent(userHandle)}&postIds=${encodeURIComponent(allIds)}`
    );

    return NextResponse.json({
      post: toFrontendPost(post, engagement[post.id]),
      replies: toFrontendPosts(replies, engagement),
    });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    console.error("[bff] post detail aggregation failed", err);
    return NextResponse.json({ message: "One or more backend services are unreachable" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authorHandle = req.nextUrl.searchParams.get("authorHandle");
  if (!authorHandle) {
    return NextResponse.json({ message: "authorHandle is required" }, { status: 400 });
  }

  try {
    await callService("posts", `/posts/${params.id}?authorHandle=${encodeURIComponent(authorHandle)}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 403) {
      return NextResponse.json({ message: "You can only delete your own posts" }, { status: 403 });
    }
    if (err instanceof ServiceError && err.status === 404) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    console.error("[bff] delete post failed", err);
    return NextResponse.json({ message: "posts-service is unreachable" }, { status: 502 });
  }
}

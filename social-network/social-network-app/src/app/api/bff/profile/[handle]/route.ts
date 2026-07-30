import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import { toFrontendPosts, toFrontendUser } from "@/lib/services/mappers";
import type { EngagementStateMap, ServicePost, ServiceUser } from "@/lib/services/types";

type Tab = "posts" | "replies" | "media" | "likes";

async function fetchTabPosts(handle: string, tab: Tab): Promise<ServicePost[]> {
  if (tab === "likes") {
    const postIds = await callService<string[]>("engagement", `/engagement/likes?userHandle=${encodeURIComponent(handle)}`);
    if (postIds.length === 0) return [];
    return callService<ServicePost[]>("posts", `/posts?ids=${encodeURIComponent(postIds.join(","))}`);
  }
  if (tab === "media") {
    return callService<ServicePost[]>("posts", `/posts?authorHandle=${encodeURIComponent(handle)}&type=all&media=true`);
  }
  if (tab === "replies") {
    return callService<ServicePost[]>("posts", `/posts?authorHandle=${encodeURIComponent(handle)}&type=replies`);
  }
  return callService<ServicePost[]>("posts", `/posts?authorHandle=${encodeURIComponent(handle)}&type=posts`);
}

export async function GET(req: NextRequest, { params }: { params: { handle: string } }) {
  const handle = params.handle;
  const viewerHandle = req.nextUrl.searchParams.get("viewerHandle") ?? "jordankim";
  const tab = (req.nextUrl.searchParams.get("tab") as Tab) ?? "posts";
  const isMe = handle === viewerHandle;

  try {
    const [user, posts] = await Promise.all([
      callService<ServiceUser>("users", `/users/${encodeURIComponent(handle)}`),
      fetchTabPosts(handle, tab),
    ]);

    const [followState, engagement] = await Promise.all([
      isMe
        ? Promise.resolve({ following: false })
        : callService<{ following: boolean }>(
            "users",
            `/users/${encodeURIComponent(handle)}/follow-state?viewerHandle=${encodeURIComponent(viewerHandle)}`
          ),
      posts.length > 0
        ? callService<EngagementStateMap>(
            "engagement",
            `/engagement/state?userHandle=${encodeURIComponent(viewerHandle)}&postIds=${encodeURIComponent(posts.map((p) => p.id).join(","))}`
          )
        : Promise.resolve<EngagementStateMap>({}),
    ]);

    return NextResponse.json({
      user: toFrontendUser(user, { isFollowing: followState.following }),
      isMe,
      posts: toFrontendPosts(posts, engagement),
    });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    console.error("[bff] profile aggregation failed", err);
    return NextResponse.json({ message: "One or more backend services are unreachable" }, { status: 502 });
  }
}

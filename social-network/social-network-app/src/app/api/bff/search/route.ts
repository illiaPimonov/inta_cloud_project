import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import { toFrontendAuthor, toFrontendPosts } from "@/lib/services/mappers";
import type { EngagementStateMap, ServicePost, ServiceUser } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  if (!q) {
    return NextResponse.json({ users: [], posts: [] });
  }

  try {
    const [users, posts] = await Promise.all([
      callService<ServiceUser[]>("users", `/users?query=${encodeURIComponent(q)}`),
      callService<ServicePost[]>("posts", `/posts?query=${encodeURIComponent(q)}&type=all`),
    ]);

    const engagement =
      posts.length > 0
        ? await callService<EngagementStateMap>(
            "engagement",
            `/engagement/state?userHandle=${encodeURIComponent(userHandle)}&postIds=${encodeURIComponent(posts.map((p) => p.id).join(","))}`
          )
        : {};

    return NextResponse.json({
      users: users.map((u) => toFrontendAuthor(u)),
      posts: toFrontendPosts(posts, engagement),
    });
  } catch (err) {
    console.error("[bff] search failed", err);
    return NextResponse.json({ message: "posts-service or users-service is unreachable" }, { status: 502 });
  }
}

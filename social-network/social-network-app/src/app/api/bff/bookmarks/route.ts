import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import { toFrontendPosts } from "@/lib/services/mappers";
import type { EngagementStateMap, ServicePost } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const postIds = await callService<string[]>("engagement", `/engagement/bookmarks?userHandle=${encodeURIComponent(userHandle)}`);
    if (postIds.length === 0) return NextResponse.json([]);

    const idsParam = postIds.join(",");
    const [posts, engagement] = await Promise.all([
      callService<ServicePost[]>("posts", `/posts?ids=${encodeURIComponent(idsParam)}`),
      callService<EngagementStateMap>(
        "engagement",
        `/engagement/state?userHandle=${encodeURIComponent(userHandle)}&postIds=${encodeURIComponent(idsParam)}`
      ),
    ]);

    const byId = new Map(posts.map((p) => [p.id, p]));
    const ordered = postIds.map((id) => byId.get(id)).filter((p): p is ServicePost => !!p);

    return NextResponse.json(toFrontendPosts(ordered, engagement));
  } catch (err) {
    console.error("[bff] bookmarks fetch failed", err);
    return NextResponse.json({ message: "engagement-service or posts-service is unreachable" }, { status: 502 });
  }
}

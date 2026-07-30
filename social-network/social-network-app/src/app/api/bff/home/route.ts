import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import { computeTrendsFromPosts, toFrontendAuthor, toFrontendPosts, toFrontendTrend } from "@/lib/services/mappers";
import type { ServicePost, EngagementStateMap, ServiceTrend, ServiceUser } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";

  try {
    const posts = await callService<ServicePost[]>("posts", "/posts");

    const postIds = posts.map((p) => p.id).join(",");
    const [engagement, allPosts, suggestions] = await Promise.all([
      postIds
        ? callService<EngagementStateMap>(
            "engagement",
            `/engagement/state?userHandle=${encodeURIComponent(userHandle)}&postIds=${encodeURIComponent(postIds)}`
          )
        : Promise.resolve<EngagementStateMap>({}),

      callService<ServicePost[]>("posts", "/posts?type=all"),
      callService<ServiceUser[]>("users", `/users/suggestions?exclude=${encodeURIComponent(userHandle)}&limit=4`),
    ]);

    const computedTrends = computeTrendsFromPosts(allPosts, 3);
    const trends = computedTrends.length > 0
      ? computedTrends
      : (await callService<ServiceTrend[]>("search", "/trends")).map(toFrontendTrend);

    return NextResponse.json({
      posts: toFrontendPosts(posts, engagement),
      trends,
      suggestions: suggestions.map((u) => toFrontendAuthor(u)),
    });
  } catch (err) {
    console.error("[bff] home feed aggregation failed", err);
    return NextResponse.json(
      { message: "One or more backend services are unreachable" },
      { status: 502 }
    );
  }
}

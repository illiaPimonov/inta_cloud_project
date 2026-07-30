import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/services/client";
import { toFrontendUser } from "@/lib/services/mappers";
import type { ServiceUser } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const userHandle = req.nextUrl.searchParams.get("userHandle") ?? "jordankim";
  const limit = req.nextUrl.searchParams.get("limit") ?? "10";

  try {
    const suggestions = await callService<ServiceUser[]>(
      "users",
      `/users/suggestions?exclude=${encodeURIComponent(userHandle)}&limit=${encodeURIComponent(limit)}`
    );

    const withFollowState = await Promise.all(
      suggestions.map(async (u) => {
        try {
          const state = await callService<{ following: boolean }>(
            "users",
            `/users/${encodeURIComponent(u.handle)}/follow-state?viewerHandle=${encodeURIComponent(userHandle)}`
          );
          return toFrontendUser(u, { isFollowing: state.following });
        } catch {
          return toFrontendUser(u, { isFollowing: false });
        }
      })
    );

    return NextResponse.json(withFollowState);
  } catch (err) {
    console.error("[bff] follow suggestions fetch failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}

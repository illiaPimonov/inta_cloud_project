import type { EngagementState, EngagementStateMap, ServicePost, ServiceUser } from "./types";
import type { Post, Trend, User } from "@/lib/types";
import type { ServiceTrend } from "./types";

export function toFrontendUser(u: ServiceUser, opts?: { isFollowing?: boolean }): User {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    bio: u.bio,
    location: u.location,
    website: u.website,
    joined: u.joined,
    followingCount: u.followingCount,
    followersCount: u.followersCount,
    isFollowing: opts?.isFollowing,
  };
}

export function toFrontendAuthor(u: Pick<ServiceUser, "name" | "handle">): User {
  return { id: u.handle, name: u.name, handle: u.handle };
}

export function toFrontendPost(p: ServicePost, engagement?: EngagementState): Post {
  return {
    id: p.id,
    author: toFrontendAuthor({ name: p.authorName, handle: p.authorHandle }),
    text: p.text,
    createdAt: p.createdAt,
    timestamp: p.timestamp,
    hasMedia: p.hasMedia,
    mediaHeight: p.mediaHeight,
    stats: p.stats,
    liked: engagement?.liked ?? false,
    reposted: engagement?.reposted ?? false,
    bookmarked: engagement?.bookmarked ?? false,
  };
}

export function toFrontendPosts(posts: ServicePost[], engagement: EngagementStateMap): Post[] {
  return posts.map((p) => toFrontendPost(p, engagement[p.id]));
}

export function toFrontendTrend(t: ServiceTrend): Trend {
  return { category: t.category, tag: t.tag, postCount: t.postCount };
}

export function computeTrendsFromPosts(posts: ServicePost[], limit = 3): Trend[] {
  const hashtagPattern = /#[a-zA-Z0-9_]+/g;
  const counts = new Map<string, number>();

  for (const post of posts) {
    const matches = post.text.match(hashtagPattern) ?? [];
    const seenInThisPost = new Set<string>();
    for (const raw of matches) {
      const tag = raw.toLowerCase();
      if (seenInThisPost.has(tag)) continue;
      seenInThisPost.add(tag);
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({
      category: "Trending",
      tag,
      postCount: `${count} post${count === 1 ? "" : "s"}`,
    }));
}

export interface ServiceUser {
  id: string;
  name: string;
  handle: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  joined?: string;
  followingCount: number;
  followersCount: number;
  isSuggested: boolean;
}

export interface ServicePostStats {
  replies: number;
  reposts: number;
  likes: number;
}

export interface ServicePost {
  id: string;
  authorHandle: string;
  authorName: string;
  text: string;
  createdAt: string;
  timestamp: string;
  hasMedia: boolean;
  mediaHeight?: number;
  replyToPostId?: string | null;
  stats: ServicePostStats;
}

export interface EngagementState {
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
}

export type EngagementStateMap = Record<string, EngagementState>;

export interface ServiceNotification {
  id: string;
  recipientHandle: string;
  type: "like" | "follow" | "reply" | "repost" | "mention";
  actors: { name: string; handle: string }[];
  extraCount?: number;
  postExcerpt?: string;
  unread: boolean;
  createdAt: string;
}

export interface ServiceConversationSummary {
  id: string;
  otherHandle: string;
  otherName: string;
  lastMessage: string;
  lastMessageFromMe: boolean;
  unread: boolean;
  updatedAt: string;
}

export interface ServiceMessage {
  id: string;
  fromMe: boolean;
  text: string;
  sentAt: string;
}

export interface ServiceTrend {
  id: string;
  category: string;
  tag: string;
  postCount: string;
}

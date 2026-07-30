export interface User {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  location?: string;
  website?: string;
  joined?: string;
  followingCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  timestamp: string;
  hasMedia?: boolean;
  mediaHeight?: number;
  stats: {
    replies: number;
    reposts: number;
    likes: number;
  };
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
}

export interface Reply extends Post {
  parentId: string;
}

export type NotificationType = "like" | "follow" | "reply" | "repost" | "mention";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actors: User[];
  extraCount?: number;
  postExcerpt?: string;
  unread?: boolean;
}

export interface Message {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageFromMe?: boolean;
  time: string;
  unread?: boolean;
  messages: Message[];
}

export interface Trend {
  category: string;
  tag: string;
  postCount: string;
}

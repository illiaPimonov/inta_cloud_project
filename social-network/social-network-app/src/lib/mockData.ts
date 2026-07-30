import type {
  User,
  Post,
  Reply,
  AppNotification,
  Conversation,
  Trend,
} from "./types";

export const currentUser: User = {
  id: "u-jordankim",
  name: "Jordan Kim",
  handle: "jordankim",
  bio: "Building things on the internet.",
  location: "Remote",
  followingCount: 128,
  followersCount: 940,
};

export const users: Record<string, User> = {
  priyanair: {
    id: "u-priyanair",
    name: "Priya Nair",
    handle: "priyanair",
    bio: "Product designer. Building tools for makers. Coffee enthusiast.",
    location: "Bengaluru",
    website: "priyanair.dev",
    joined: "March 2021",
    followingCount: 482,
    followersCount: 12400,
  },
  devpatel: {
    id: "u-devpatel",
    name: "Dev Patel",
    handle: "devpatel",
    bio: "Frontend engineer. Open source maintainer.",
    location: "Toronto",
    followingCount: 210,
    followersCount: 5400,
  },
  alexchen: {
    id: "u-alexchen",
    name: "Alex Chen",
    handle: "alexchen",
    bio: "Product manager. Talks about MVPs and roadmaps.",
    isFollowing: false,
  },
  mayatorres: {
    id: "u-mayatorres",
    name: "Maya Torres",
    handle: "mayatorres",
    bio: "Design systems lead. Writes about scalable UI.",
    isFollowing: false,
  },
  samosei: {
    id: "u-samosei",
    name: "Sam Osei",
    handle: "samosei",
    bio: "Frontend engineer. Open source maintainer.",
    isFollowing: false,
  },
  rinaito: {
    id: "u-rinaito",
    name: "Rina Ito",
    handle: "rinaito",
    bio: "Illustrator. Shares process sketches daily.",
    isFollowing: false,
  },
};

export const posts: Post[] = [
  {
    id: "p1",
    author: users.priyanair,
    text: "Shipping our new onboarding flow today — huge thanks to the team. #buildinpublic",
    createdAt: "2026-07-30T10:00:00Z",
    timestamp: "2h",
    hasMedia: true,
    mediaHeight: 180,
    stats: { replies: 12, reposts: 4, likes: 89 },
  },
  {
    id: "p2",
    author: users.devpatel,
    text: "Hot take: infinite scroll beats pagination for social feeds every time. Numbered pages feel dated next to a continuous timeline.",
    createdAt: "2026-07-30T08:00:00Z",
    timestamp: "4h",
    stats: { replies: 30, reposts: 8, likes: 210 },
  },
  {
    id: "p3",
    author: users.mayatorres,
    text: "Our new design systems doc is live — covers tokens, components, and contribution guidelines.",
    createdAt: "2026-07-29T12:00:00Z",
    timestamp: "1d",
    hasMedia: true,
    mediaHeight: 180,
    stats: { replies: 6, reposts: 2, likes: 54 },
  },
];

export const repliesByPostId: Record<string, Reply[]> = {
  p2: [
    {
      id: "r1",
      parentId: "p2",
      author: users.priyanair,
      text: "Agreed, and it keeps scroll position intact too.",
      createdAt: "2026-07-30T09:00:00Z",
      timestamp: "1h",
      stats: { replies: 0, reposts: 0, likes: 3 },
    },
  ],
};

export const bookmarkedPosts: Post[] = [
  { ...posts[1], bookmarked: true },
  { ...posts[2], bookmarked: true },
];

export const trends: Trend[] = [
  { category: "Technology · Trending", tag: "#buildinpublic", postCount: "18.2K posts" },
  { category: "Design · Trending", tag: "Design systems", postCount: "6,204 posts" },
];

export const whoToFollow: User[] = [users.alexchen];

export const youMightLike: User[] = [users.mayatorres, users.samosei];

export const followSuggestions: User[] = [
  users.mayatorres,
  users.samosei,
  users.alexchen,
  users.rinaito,
];

export const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "like",
    actors: [users.alexchen, users.devpatel, users.priyanair, users.samosei, users.rinaito],
    extraCount: 4,
    postExcerpt: '"Shipping our new onboarding flow today…"',
    unread: true,
  },
  {
    id: "n2",
    type: "follow",
    actors: [users.mayatorres],
  },
  {
    id: "n3",
    type: "reply",
    actors: [users.devpatel],
    postExcerpt: '"Agreed, and it keeps scroll position intact too."',
  },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    user: users.mayatorres,
    lastMessage: "Sent the updated spec, take a look when you can",
    time: "2m",
    unread: true,
    messages: [
      { id: "m1", fromMe: false, text: "Hey! Just pushed the updated onboarding spec", time: "10:02" },
      { id: "m2", fromMe: false, text: "Sent the updated spec, take a look when you can", time: "10:03" },
      { id: "m3", fromMe: true, text: "On it — reviewing now, thank you!", time: "10:05" },
    ],
  },
  {
    id: "c2",
    user: users.devpatel,
    lastMessage: "You: sounds good, let's ship it Friday",
    lastMessageFromMe: true,
    time: "1h",
    messages: [
      { id: "m4", fromMe: false, text: "Can we ship the new flow this week?", time: "09:10" },
      { id: "m5", fromMe: true, text: "sounds good, let's ship it Friday", time: "09:20" },
    ],
  },
  {
    id: "c3",
    user: users.alexchen,
    lastMessage: "Thanks for the intro 🙏",
    time: "Yesterday",
    messages: [{ id: "m6", fromMe: false, text: "Thanks for the intro 🙏", time: "Yesterday" }],
  },
];

export const recentSearches: string[] = ["onboarding flow", "@devpatel"];

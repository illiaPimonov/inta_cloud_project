export const SERVICE_URLS = {
  users: process.env.USERS_SERVICE_URL ?? "http://localhost:5001",
  posts: process.env.POSTS_SERVICE_URL ?? "http://localhost:5002",
  engagement: process.env.ENGAGEMENT_SERVICE_URL ?? "http://localhost:5003",
  notifications: process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:5004",
  messages: process.env.MESSAGES_SERVICE_URL ?? "http://localhost:5005",
  search: process.env.SEARCH_SERVICE_URL ?? "http://localhost:5006",
} as const;

export type ServiceName = keyof typeof SERVICE_URLS;

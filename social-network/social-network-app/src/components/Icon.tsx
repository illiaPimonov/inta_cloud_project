export type IconName =
  | "home"
  | "search"
  | "notifications"
  | "messages"
  | "profile"
  | "follow"
  | "bookmark"
  | "bookmark-filled"
  | "settings"
  | "logo"
  | "more"
  | "reply"
  | "repost"
  | "like"
  | "like-filled"
  | "share"
  | "back"
  | "chevron-down"
  | "location"
  | "link"
  | "close"
  | "send"
  | "plus"
  | "image"
  | "gif"
  | "poll"
  | "emoji"
  | "schedule";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
}

export default function Icon({ name, size = 20, className, color }: IconProps) {
  const stroke = color ?? "currentColor";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "search":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 13 6 8z" />
          <path d="M10.3 21a1.8 1.8 0 0 0 3.4 0" />
        </svg>
      );
    case "messages":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v11H9l-5 4V5z" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
        </svg>
      );
    case "follow":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21c0-4 3.2-6.5 7-6.5" />
          <path d="M18 7v6M15 10h6" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v18l-6-4.2L6 21V3z" />
        </svg>
      );
    case "bookmark-filled":
      return (
        <svg {...common} fill={stroke}>
          <path d="M6 3h12v18l-6-4.2L6 21V3z" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M5.1 18.9L7.2 16.8M16.8 7.2l2.1-2.1" />
        </svg>
      );
    case "logo":
      return (
        <svg {...common} fill={stroke}>
          <polygon points="12,2 14.9,9.1 22,9.1 16.2,13.6 18.4,21 12,16.3 5.6,21 7.8,13.6 2,9.1 9.1,9.1" />
        </svg>
      );
    case "more":
      return (
        <svg {...common} fill={stroke}>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      );
    case "reply":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v11H9l-5 4V5z" />
        </svg>
      );
    case "repost":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10v4" />
          <path d="M17 7l-3-3M17 7l-3 3" />
          <path d="M17 17H7v-4" />
          <path d="M7 17l3 3M7 17l3-3" />
        </svg>
      );
    case "like":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s-7-4.6-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-2.3 4.4-9.3 9-9.3 9z" />
        </svg>
      );
    case "like-filled":
      return (
        <svg {...common} fill={stroke}>
          <path d="M12 20s-7-4.6-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-2.3 4.4-9.3 9-9.3 9z" />
        </svg>
      );
    case "share":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15V3M12 3l-4 4M12 3l4 4" />
          <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
        </svg>
      );
    case "back":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M11 6l-6 6 6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "location":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      );
    case "link":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 15l6-6" />
          <path d="M8 13l-2.5 2.5a3 3 0 0 0 4.24 4.24L12 17.5" />
          <path d="M16 11l2.5-2.5a3 3 0 0 0-4.24-4.24L12 6.5" />
        </svg>
      );
    case "close":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "send":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "image":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5.5-5.5L4 21" />
        </svg>
      );
    case "gif":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 10.5v3M8 10.5h1.6a1.4 1.4 0 0 1 0 2.8H8M12.5 13.5v-3h2M12.5 12h1.5M16 10.5v3M18.5 10.5H17v3h1.5" />
        </svg>
      );
    case "poll":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="10" width="4" height="10" />
          <rect x="10" y="6" width="4" height="14" />
          <rect x="17" y="3" width="4" height="17" />
        </svg>
      );
    case "emoji":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10" r="1" />
          <circle cx="15" cy="10" r="1" />
          <path d="M8 14.5c1 1.5 2.5 2.3 4 2.3s3-.8 4-2.3" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...common} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l3 2" />
          <path d="M9 2h6" />
        </svg>
      );
    default:
      return null;
  }
}

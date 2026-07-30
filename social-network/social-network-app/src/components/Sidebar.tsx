"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { IconName } from "./Icon";
import Avatar from "./Avatar";
import AccountMenu from "./AccountMenu";
import { useCompose } from "@/store/composeStore";
import { getCurrentUserHandle, getCurrentUserName } from "@/lib/session";
import type { ServiceNotification } from "@/lib/services/types";
import styles from "./Sidebar.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { openCompose } = useCompose();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const userHandle = getCurrentUserHandle() ?? "jordankim";
  const userName = getCurrentUserName();

  useEffect(() => {
    fetch(`/api/bff/notifications?userHandle=${encodeURIComponent(userHandle)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ServiceNotification[]) => setUnreadCount(data.filter((n) => n.unread).length))
      .catch(() => setUnreadCount(0));
  }, [userHandle, pathname]);

  const navItems: NavItem[] = [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/search", label: "Search", icon: "search" },
    { href: "/notifications", label: "Notifications", icon: "notifications", badge: unreadCount || undefined },
    { href: "/messages", label: "Messages", icon: "messages" },
    { href: `/profile/${userHandle}`, label: "Profile", icon: "profile" },
    { href: "/follow", label: "Follow", icon: "follow" },
    { href: "/bookmarks", label: "Bookmarks", icon: "bookmark" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.logo}>
        <Icon name="logo" size={32} color="var(--color-destructive)" />
      </div>

      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${active ? styles.active : ""}`}
          >
            <span className={styles.navLeft}>
              <Icon
                name={item.icon}
                size={20}
                color={active ? "var(--color-accent)" : "var(--color-text-secondary)"}
              />
              <span className={styles.navLabel}>{item.label}</span>
            </span>
            {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
          </Link>
        );
      })}

      <button className={styles.postBtn} onClick={openCompose}>
        Post
      </button>

      <div className={styles.spacer} />

      <div className={styles.accountWrap} ref={wrapRef}>
        {menuOpen && <AccountMenu handle={userHandle} onClose={() => setMenuOpen(false)} />}
        <button
          className={`${styles.account} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Avatar name={userName} size={36} />
          <span className={styles.accountInfo}>
            <div className={styles.accountName}>{userName}</div>
            <div className={styles.accountHandle}>@{userHandle}</div>
          </span>
          <Icon name="more" size={18} color={menuOpen ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
        </button>
      </div>
    </nav>
  );
}

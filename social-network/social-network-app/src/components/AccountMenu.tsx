"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/store/toastStore";
import { logout } from "@/lib/session";
import styles from "./AccountMenu.module.css";

export default function AccountMenu({ handle, onClose }: { handle: string; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/login");
  };

  const handleAddAccount = () => {

    showToast("This demo supports one active session — logging out first");
    logout();
    onClose();
    router.push("/login");
  };

  return (
    <div className={styles.menu} role="menu">
      <button className={styles.item} onClick={handleAddAccount}>
        Add an existing account
      </button>
      <button className={styles.item} onClick={handleLogout}>
        Log out @{handle}
      </button>
    </div>
  );
}

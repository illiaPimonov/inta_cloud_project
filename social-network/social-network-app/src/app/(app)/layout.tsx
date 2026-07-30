import Sidebar from "@/components/Sidebar";
import ComposeModal from "@/components/ComposeModal";
import AuthGuard from "@/components/AuthGuard";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>{children}</div>
      </div>
      <ComposeModal />
    </AuthGuard>
  );
}

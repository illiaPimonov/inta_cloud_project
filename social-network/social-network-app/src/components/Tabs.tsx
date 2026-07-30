"use client";

import styles from "./Tabs.module.css";

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  trailing?: React.ReactNode;
  height?: number;
}

export default function Tabs({ tabs, active, onChange, trailing, height = 52 }: TabsProps) {
  return (
    <div className={styles.tabs} style={{ alignItems: "center" }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`${styles.tab} ${tab === active ? styles.active : ""}`}
          style={{ height }}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
      {trailing && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>{trailing}</div>}
    </div>
  );
}

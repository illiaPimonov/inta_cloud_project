"use client";

import { useRouter } from "next/navigation";
import Icon from "./Icon";
import styles from "./SearchBox.module.css";

export default function SearchBox({
  placeholder = "Search",
  defaultValue = "",
  navigateOnSubmit = true,
}: {
  placeholder?: string;
  defaultValue?: string;
  navigateOnSubmit?: boolean;
}) {
  const router = useRouter();

  return (
    <form
      className={styles.wrap}
      onSubmit={(e) => {
        e.preventDefault();
        if (navigateOnSubmit) router.push("/search");
      }}
    >
      <Icon name="search" size={16} color="var(--color-text-tertiary)" />
      <input
        className={styles.input}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onFocus={() => navigateOnSubmit && router.push("/search")}
        readOnly={navigateOnSubmit}
      />
    </form>
  );
}

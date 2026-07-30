import type { Metadata } from "next";
import "./globals.css";
import ToastViewport from "@/store/ToastViewport";

export const metadata: Metadata = {
  title: "Social Network — MVP",
  description: "Dark-mode social network UI kit built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}

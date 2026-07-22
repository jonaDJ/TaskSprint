import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "TaskSprint",
  description: "Plan tasks, goals, habits, and weekly progress.",
  applicationName: "TaskSprint",
  appleWebApp: {
    capable: true,
    title: "TaskSprint",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = { themeColor: "#243229" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}

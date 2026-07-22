import type { Metadata } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "TaskSprint — Weekly planner",
  description: "A focused weekly planner with 30-minute time blocks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}

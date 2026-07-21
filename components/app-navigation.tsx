import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarIcon, ChartIcon, CheckIcon, MoreIcon, TargetIcon } from "./icons";

type Page = "calendar" | "goals" | "habits";

export function AppSidebar({ active, children }: { active: Page; children?: ReactNode }) {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><CheckIcon /></span><span>TaskSprint</span></Link>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        <Link className={active === "calendar" ? "active" : ""} href="/" aria-current={active === "calendar" ? "page" : undefined}><CalendarIcon /><span>Calendar</span></Link>
        <Link className={active === "goals" ? "active" : ""} href="/goals" aria-current={active === "goals" ? "page" : undefined}><TargetIcon /><span>Goals &amp; Projects</span></Link>
        <Link className={active === "habits" ? "active" : ""} href="/habits" aria-current={active === "habits" ? "page" : undefined}><ChartIcon /><span>Habits &amp; Streaks</span></Link>
      </nav>
      {children}
      <div className="profile"><span>JD</span><div><strong>Jonathan</strong><small>Personal workspace</small></div><MoreIcon /></div>
    </aside>
  );
}

export function MobileNavigation({ active }: { active: Page }) {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <Link className={active === "calendar" ? "active" : ""} href="/" aria-current={active === "calendar" ? "page" : undefined}><CalendarIcon /><span>Calendar</span></Link>
      <Link className={active === "goals" ? "active" : ""} href="/goals" aria-current={active === "goals" ? "page" : undefined}><TargetIcon /><span>Goals</span></Link>
      <Link className={active === "habits" ? "active" : ""} href="/habits" aria-current={active === "habits" ? "page" : undefined}><ChartIcon /><span>Habits</span></Link>
    </nav>
  );
}

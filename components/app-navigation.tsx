"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { CalendarIcon, HabitIcon, SprintIcon, ChevronLeft, TargetIcon } from "./icons";
import { CloudAccount } from "./cloud-account";

type Page = "calendar" | "goals" | "habits";
let sidebarExpanded = true;

export function AppSidebar({ active, children }: { active: Page; children?: ReactNode }) {
  const [open, setOpen] = useState(() => sidebarExpanded);
  const toggleSidebar = () => setOpen(current => {
    sidebarExpanded = !current;
    return sidebarExpanded;
  });
  return (
    <aside className={`sidebar ${open ? "" : "collapsed"}`}>
      <div className="sidebar-brand-row"><Link className="brand" href="/"><span className="brand-mark"><SprintIcon /></span><span>TaskSprint</span></Link><button className="sidebar-toggle" onClick={toggleSidebar} aria-label={open ? "Collapse navigation" : "Expand navigation"} title={open ? "Collapse sidebar" : "Expand sidebar"}><ChevronLeft /></button></div>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        <Link className={active === "calendar" ? "active" : ""} href="/" aria-current={active === "calendar" ? "page" : undefined}><CalendarIcon /><span>Calendar</span></Link>
        <Link className={active === "goals" ? "active" : ""} href="/goals" aria-current={active === "goals" ? "page" : undefined}><TargetIcon /><span>Goals &amp; Projects</span></Link>
        <Link className={active === "habits" ? "active" : ""} href="/habits" aria-current={active === "habits" ? "page" : undefined}><HabitIcon /><span>Habits &amp; Streaks</span></Link>
      </nav>
      {children}
      <CloudAccount />
    </aside>
  );
}

export function MobileNavigation({ active }: { active: Page }) {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <Link className={active === "calendar" ? "active" : ""} href="/" aria-current={active === "calendar" ? "page" : undefined}><CalendarIcon /><span>Calendar</span></Link>
      <Link className={active === "goals" ? "active" : ""} href="/goals" aria-current={active === "goals" ? "page" : undefined}><TargetIcon /><span>Goals</span></Link>
      <Link className={active === "habits" ? "active" : ""} href="/habits" aria-current={active === "habits" ? "page" : undefined}><HabitIcon /><span>Habits</span></Link>
      <CloudAccount mobile />
    </nav>
  );
}

"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { CalendarIcon, ChartIcon, HabitIcon, SprintIcon, ChevronLeft, TargetIcon } from "./icons";
import { CloudAccount } from "./cloud-account";

type Page = "calendar" | "goals" | "habits" | "reports";
let sidebarExpanded = true;

export function AppSidebar({ active, children }: { active: Page; children?: ReactNode }) {
  const [open, setOpen] = useState(() => sidebarExpanded);
  const toggleSidebar = () => setOpen(current => {
    sidebarExpanded = !current;
    return sidebarExpanded;
  });
  return (
    <aside className={`sidebar page-${active} ${open ? "" : "collapsed"}`}>
      <div className="sidebar-brand-row"><Link className="brand" href="/" aria-label="TaskSprint home"><span className="brand-mark"><SprintIcon /></span><span>TaskSprint</span></Link><button className="sidebar-toggle" onClick={toggleSidebar} aria-label={open ? "Collapse navigation" : "Expand navigation"} title={open ? "Collapse sidebar" : "Expand sidebar"}><ChevronLeft /></button></div>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        <Link className={active === "calendar" ? "active" : ""} href="/" aria-label="Calendar" title="Calendar" aria-current={active === "calendar" ? "page" : undefined}><CalendarIcon /><span>Calendar</span></Link>
        <Link className={active === "goals" ? "active" : ""} href="/goals" aria-label="Goals and Projects" title="Goals and Projects" aria-current={active === "goals" ? "page" : undefined}><TargetIcon /><span>Goals &amp; Projects</span></Link>
        <Link className={active === "habits" ? "active" : ""} href="/habits" aria-label="Habits and Streaks" title="Habits and Streaks" aria-current={active === "habits" ? "page" : undefined}><HabitIcon /><span>Habits &amp; Streaks</span></Link>
        <Link className={active === "reports" ? "active" : ""} href="/reports" aria-label="Reports" title="Reports" aria-current={active === "reports" ? "page" : undefined}><ChartIcon /><span>Reports</span><small>Soon</small></Link>
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
      <Link className={active === "reports" ? "active" : ""} href="/reports" aria-current={active === "reports" ? "page" : undefined}><ChartIcon /><span>Reports</span><small>Soon</small></Link>
      <CloudAccount mobile />
    </nav>
  );
}

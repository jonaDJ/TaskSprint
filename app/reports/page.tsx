import { AppSidebar, MobileNavigation } from "@/components/app-navigation";
import { ChartIcon } from "@/components/icons";

export default function ReportsPage() {
  return (
    <main className="app-shell">
      <AppSidebar active="reports" />
      <section className="main-content reports-page">
        <header className="page-header">
          <div><span className="eyebrow">Understand your progress</span><h1>Reports</h1></div>
        </header>
        <section className="reports-coming-soon">
          <span className="reports-icon"><ChartIcon /></span>
          <span className="eyebrow">Coming soon</span>
          <h2>Your progress, made clear.</h2>
          <p>See how your focused time, completed goals, and habits develop across days, weeks, and months.</p>
          <div className="report-preview" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        </section>
      </section>
      <MobileNavigation active="reports" />
    </main>
  );
}

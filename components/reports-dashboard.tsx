"use client";

import { useMemo, useState } from "react";
import { AppSidebar, MobileNavigation } from "./app-navigation";
import { CalendarIcon, ChartIcon, CheckIcon, HabitIcon, TargetIcon } from "./icons";
import { useCloudCollection } from "@/lib/use-cloud-collection";
import { categoryColors, minutesFromTime, taskComputedStatus, type CalendarTask } from "@/lib/calendar";

type ReportTab = "overview" | "calendar" | "goals" | "habits";
type Range = "today" | "week" | "month" | "year" | "all";
type Goal = { id: string; title: string; category: string; priority: string; status: string; startDate: string; targetDate: string; progressType: "Pages" | "Subtasks"; current: number; total: number; milestones: { done: boolean }[]; completedAt?: string };
type Habit = { id: string; name: string; days: number[]; colour: string; createdDate: string; completions: string[] };

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromKey = (key: string) => new Date(`${key}T12:00:00`);
const shift = (date: Date, amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
const daysBetween = (start: Date, end: Date) => { const days: Date[] = []; for (let date = new Date(start); date <= end; date = shift(date, 1)) days.push(date); return days; };
const hoursLabel = (minutes: number) => minutes >= 60 ? `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)}h` : `${minutes}m`;
const percent = (value: number, total: number) => total ? Math.min(100, Math.round(value / total * 100)) : 0;

function goalProgress(goal: Goal) {
  if (goal.progressType === "Subtasks") return percent(goal.milestones.filter(item => item.done).length, goal.milestones.length);
  return percent(goal.current || 0, goal.total || 0);
}

function habitStreak(habit: Habit, today: Date) {
  const done = new Set(habit.completions);
  let streak = 0;
  for (let offset = 0; offset < 730; offset += 1) {
    const day = shift(today, -offset);
    if (!habit.days.includes(day.getDay())) continue;
    if (done.has(dateKey(day))) streak += 1;
    else break;
  }
  return streak;
}

export function ReportsDashboard() {
  const { items: tasks } = useCloudCollection<CalendarTask>("calendar");
  const { items: goals } = useCloudCollection<Goal>("goals");
  const { items: habits } = useCloudCollection<Habit>("habits");
  const [tab, setTab] = useState<ReportTab>("overview");
  const [range, setRange] = useState<Range>("week");
  const [now] = useState(() => new Date());
  const [today] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const todayKey = dateKey(today);

  const report = useMemo(() => {
    const earliest = [...tasks.map(item => item.date), ...goals.map(item => item.startDate), ...habits.map(item => item.createdDate)].filter(Boolean).sort()[0] || todayKey;
    const rangeDays: Record<Exclude<Range, "all">, number> = { today: 1, week: 7, month: 30, year: 365 };
    const earliestDate = fromKey(earliest);
    const start = range === "all" ? earliestDate > today ? today : earliestDate : shift(today, -(rangeDays[range] - 1));
    const startKey = dateKey(start);
    const days = daysBetween(start, today);
    const periodTasks = tasks.filter(item => item.date >= startKey && item.date <= todayKey);
    const completedTasks = periodTasks.filter(item => item.status === "completed");
    const missedTasks = periodTasks.filter(item => taskComputedStatus(item, now) === "missed");
    const completedMinutes = completedTasks.reduce((sum, item) => sum + Math.max(0, minutesFromTime(item.endTime) - minutesFromTime(item.startTime)), 0);
    const plannedMinutes = periodTasks.reduce((sum, item) => sum + Math.max(0, minutesFromTime(item.endTime) - minutesFromTime(item.startTime)), 0);
    const relevantGoals = goals.filter(goal => (goal.startDate <= todayKey && goal.targetDate >= startKey) || Boolean(goal.completedAt && goal.completedAt >= startKey && goal.completedAt <= todayKey));
    const completedGoals = goals.filter(goal => goal.status === "Completed" && Boolean(goal.completedAt && goal.completedAt >= startKey && goal.completedAt <= todayKey));
    const overdueGoals = goals.filter(goal => goal.status !== "Completed" && goal.targetDate < todayKey);
    let habitOpportunities = 0;
    let habitDone = 0;
    habits.forEach(habit => days.forEach(day => {
      const key = dateKey(day);
      if (key < habit.createdDate || !habit.days.includes(day.getDay())) return;
      habitOpportunities += 1;
      if (habit.completions.includes(key)) habitDone += 1;
    }));
    const categoryMinutes = periodTasks.reduce<Record<string, number>>((result, task) => {
      result[task.category] = (result[task.category] || 0) + Math.max(0, minutesFromTime(task.endTime) - minutesFromTime(task.startTime));
      return result;
    }, {});
    const bucketSize = Math.max(1, Math.ceil(days.length / 12));
    const trend = Array.from({ length: Math.ceil(days.length / bucketSize) }, (_, index) => {
      const bucketDays = days.slice(index * bucketSize, (index + 1) * bucketSize);
      const keys = new Set(bucketDays.map(dateKey));
      const taskCount = completedTasks.filter(item => keys.has(item.date)).length;
      const habitCount = habits.reduce((sum, habit) => sum + habit.completions.filter(key => keys.has(key)).length, 0);
      const goalCount = completedGoals.filter(goal => goal.completedAt && keys.has(goal.completedAt)).length;
      return { label: bucketDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: taskCount + habitCount + goalCount };
    });
    const maxTrend = Math.max(1, ...trend.map(item => item.value));
    const habitRows = habits.map(habit => {
      const habitDays = days.filter(day => dateKey(day) >= habit.createdDate && habit.days.includes(day.getDay()));
      const completed = habitDays.filter(day => habit.completions.includes(dateKey(day))).length;
      return { ...habit, completed, expected: habitDays.length, rate: percent(completed, habitDays.length), streak: habitStreak(habit, today) };
    }).sort((a, b) => b.rate - a.rate);
    return { startKey, periodTasks, completedTasks, missedTasks, completedMinutes, plannedMinutes, taskRate: percent(completedTasks.length, completedTasks.length + missedTasks.length), relevantGoals, completedGoals, overdueGoals, averageGoalProgress: relevantGoals.length ? Math.round(relevantGoals.reduce((sum, goal) => sum + goalProgress(goal), 0) / relevantGoals.length) : 0, habitDone, habitOpportunities, habitRate: percent(habitDone, habitOpportunities), categoryMinutes, trend, maxTrend, habitRows };
  }, [goals, habits, now, range, tasks, today, todayKey]);

  const rangeLabel = range === "today" ? "Today" : range === "week" ? "7 days" : range === "month" ? "30 days" : range === "year" ? "Year" : "All time";
  const statusCounts = ["Planning", "Active", "Delayed", "Completed"].map(status => ({ status, count: report.relevantGoals.filter(goal => goal.status === status).length }));
  const categoryMax = Math.max(1, ...Object.values(report.categoryMinutes));

  return (
    <main className="app-shell">
      <AppSidebar active="reports" />
      <section className="main-content reports-page">
        <header className="reports-header"><div><span className="eyebrow">Understand your progress</span><h1>Reports</h1><p>Patterns from your calendar, goals, and habits.</p></div><label className="report-range"><span>Period</span><select value={range} onChange={event => setRange(event.target.value as Range)}><option value="today">Today</option><option value="week">7 days</option><option value="month">30 days</option><option value="year">Year</option><option value="all">All time</option></select></label></header>
        <nav className="report-tabs" aria-label="Report sections">{(["overview", "calendar", "goals", "habits"] as ReportTab[]).map(item => <button key={item} className={tab === item ? "active" : ""} aria-pressed={tab === item} onClick={() => setTab(item)}>{item === "overview" ? <ChartIcon /> : item === "calendar" ? <CalendarIcon /> : item === "goals" ? <TargetIcon /> : <HabitIcon />}<span>{item[0].toUpperCase() + item.slice(1)}</span></button>)}</nav>

        {(tab === "overview" || tab === "calendar") && <section className="report-metrics">
          <article><span className="metric-icon calendar"><CalendarIcon /></span><div><small>Completed focus</small><strong>{hoursLabel(report.completedMinutes)}</strong><p>{report.completedTasks.length} time blocks</p></div></article>
          <article><span className="metric-icon check"><CheckIcon /></span><div><small>Calendar completion</small><strong>{report.taskRate}%</strong><p>{report.missedTasks.length} missed</p></div></article>
          <article><span className="metric-icon goal"><TargetIcon /></span><div><small>Goals completed</small><strong>{report.completedGoals.length}</strong><p>{report.overdueGoals.length} overdue now</p></div></article>
          <article><span className="metric-icon habit"><HabitIcon /></span><div><small>Habit consistency</small><strong>{report.habitRate}%</strong><p>{report.habitDone} of {report.habitOpportunities}</p></div></article>
        </section>}

        {tab === "overview" && <div className="report-layout"><section className="report-panel report-trend"><header><div><h2>Activity trend</h2><p>Completed tasks, goals, and habit check-ins</p></div><span>{rangeLabel}</span></header><div className="trend-chart">{report.trend.map(item => <div key={item.label}><span title={`${item.value} completed activities`} style={{ height: `${Math.max(4, item.value / report.maxTrend * 100)}%` }} /><small>{item.label}</small></div>)}</div></section><section className="report-panel report-snapshot"><header><div><h2>Current snapshot</h2><p>What needs attention now</p></div></header><div className="snapshot-list"><div><span>Goal progress</span><strong>{report.averageGoalProgress}%</strong></div><div><span>Overdue goals</span><strong className={report.overdueGoals.length ? "danger" : ""}>{report.overdueGoals.length}</strong></div><div><span>Planned focus</span><strong>{hoursLabel(report.plannedMinutes)}</strong></div><div><span>Habit check-ins</span><strong>{report.habitDone}</strong></div></div></section></div>}

        {tab === "calendar" && <div className="report-layout"><section className="report-panel"><header><div><h2>Time by category</h2><p>All planned focus in this period</p></div></header><div className="breakdown-list">{Object.entries(report.categoryMinutes).sort((a, b) => b[1] - a[1]).map(([category, minutes]) => <div key={category}><span><i style={{ background: categoryColors[category] || categoryColors.General }} />{category}</span><b><i style={{ width: `${minutes / categoryMax * 100}%`, background: categoryColors[category] || categoryColors.General }} /></b><strong>{hoursLabel(minutes)}</strong></div>)}{!Object.keys(report.categoryMinutes).length && <p className="report-empty">No calendar activity in this period.</p>}</div></section><section className="report-panel"><header><div><h2>Task outcomes</h2><p>Completed versus missed blocks</p></div></header><div className="outcome-donut" style={{ background: report.completedTasks.length + report.missedTasks.length ? `conic-gradient(#5f9b72 0 ${report.taskRate}%,#dc8065 ${report.taskRate}% 100%)` : "#e8ebe7" }}><span><strong>{report.taskRate}%</strong><small>complete</small></span></div><div className="outcome-key"><span><i className="complete" />{report.completedTasks.length} completed</span><span><i className="missed" />{report.missedTasks.length} missed</span></div></section></div>}

        {tab === "goals" && <><section className="report-metrics compact"><article><span className="metric-icon goal"><TargetIcon /></span><div><small>Average progress</small><strong>{report.averageGoalProgress}%</strong><p>{report.relevantGoals.length} goals in period</p></div></article>{statusCounts.map(item => <article key={item.status}><div><small>{item.status}</small><strong>{item.count}</strong><p>goals</p></div></article>)}</section><section className="report-panel"><header><div><h2>Deadlines and progress</h2><p>Active finish lines ordered by due date</p></div></header><div className="report-table"><div className="report-table-head"><span>Goal</span><span>Status</span><span>Progress</span><span>Due</span></div>{goals.filter(goal => goal.status !== "Completed").sort((a, b) => a.targetDate.localeCompare(b.targetDate)).slice(0, 12).map(goal => <div key={goal.id}><strong>{goal.title}</strong><span>{goal.status}</span><span><i><b style={{ width: `${goalProgress(goal)}%` }} /></i>{goalProgress(goal)}%</span><time className={goal.targetDate < todayKey ? "overdue" : ""}>{fromKey(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></div>)}{!goals.some(goal => goal.status !== "Completed") && <p className="report-empty">No active goals.</p>}</div></section></>}

        {tab === "habits" && <><section className="report-metrics compact"><article><span className="metric-icon habit"><HabitIcon /></span><div><small>Overall consistency</small><strong>{report.habitRate}%</strong><p>{report.habitDone} completed check-ins</p></div></article><article><div><small>Best current streak</small><strong>{Math.max(0, ...report.habitRows.map(item => item.streak))}</strong><p>scheduled days</p></div></article><article><div><small>Active habits</small><strong>{habits.length}</strong><p>being tracked</p></div></article></section><section className="report-panel"><header><div><h2>Habit consistency</h2><p>Completion by habit for {rangeLabel.toLowerCase()}</p></div></header><div className="habit-report-list">{report.habitRows.map(habit => <article key={habit.id}><i style={{ background: habit.colour }} /><div><strong>{habit.name}</strong><span>{habit.completed} of {habit.expected} scheduled days</span><b><i style={{ width: `${habit.rate}%`, background: habit.colour }} /></b></div><strong>{habit.rate}%</strong><small>{habit.streak} day streak</small></article>)}{!habits.length && <p className="report-empty">Create a habit to see consistency reports.</p>}</div></section></>}
      </section>
      <MobileNavigation active="reports" />
    </main>
  );
}

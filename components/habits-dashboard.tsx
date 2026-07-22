"use client";

import { useMemo, useState } from "react";
import { AppSidebar, MobileNavigation } from "./app-navigation";
import { CheckIcon, PlusIcon, XIcon } from "./icons";
import { useCloudCollection } from "@/lib/use-cloud-collection";
import { createId } from "@/lib/id";

type Frequency = "Daily" | "Weekdays" | "Weekends" | "Custom";
type Habit = {
  id: string;
  name: string;
  frequency: Frequency;
  days: number[];
  colour: string;
  createdDate: string;
  reminder?: string;
  completions: string[];
};
const dateKey = (d = new Date()) => d.toISOString().slice(0, 10),
  uid = createId;
const colours = [
  "#567b67",
  "#d48a62",
  "#6d78a8",
  "#ba6f78",
  "#b5974f",
  "#4c8b91",
];
const scheduled = (h: Habit, d: Date) => h.days.includes(d.getDay());
const shift = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
function streaks(h: Habit) {
  const done = new Set(h.completions);
  let current = 0,
    longest = 0,
    run = 0;
  for (let i = 0; i < 400; i++) {
    const d = shift(new Date(), -i);
    if (!scheduled(h, d)) continue;
    if (done.has(dateKey(d))) current++;
    else break;
  }
  for (let i = 0; i < 400; i++) {
    const d = shift(new Date(), -399 + i);
    if (!scheduled(h, d)) continue;
    if (done.has(dateKey(d))) {
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  return { current, longest: Math.max(longest, current) };
}
function startOfWeek() {
  const d = new Date(),
    delta = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - delta);
  d.setHours(12, 0, 0, 0);
  return d;
}

function HabitForm({
  habit,
  onClose,
  onSave,
}: {
  habit?: Habit;
  onClose: () => void;
  onSave: (h: Habit) => void;
}) {
  const [name, setName] = useState(habit?.name || ""),
    [frequency, setFrequency] = useState<Frequency>(habit?.frequency || "Daily"),
    [colour, setColour] = useState(habit?.colour || colours[0]),
    [reminder, setReminder] = useState(habit?.reminder || ""),
    [customDays, setCustomDays] = useState<number[]>(habit?.frequency === "Custom" ? habit.days : [1, 3, 5]);
  const days =
    frequency === "Daily"
      ? [0, 1, 2, 3, 4, 5, 6]
      : frequency === "Weekdays"
        ? [1, 2, 3, 4, 5]
        : frequency === "Weekends"
          ? [0, 6]
        : customDays;
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="goal-dialog habit-dialog">
        <header className="dialog-header">
          <div>
            <span className="eyebrow">Daily rhythm</span>
            <h2>{habit ? "Edit habit" : "New habit"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <XIcon />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              id: habit?.id || uid(),
              name,
              frequency,
              days,
              colour,
              reminder,
              createdDate: habit?.createdDate || dateKey(),
              completions: habit?.completions || [],
            });
          }}
        >
          <label className="field">
            <span>Name</span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Speaking practice"
            />
          </label>
          {frequency === "Custom" && <fieldset className="custom-days"><legend>Include these days</legend>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, day) => <button type="button" key={label} className={customDays.includes(day) ? "selected" : ""} aria-pressed={customDays.includes(day)} onClick={() => setCustomDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day])}>{label}</button>)}<small>Select the days when this habit should appear. Unselected days are excluded.</small></fieldset>}
          <label className="field">
            <span>Frequency</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              {["Daily", "Weekdays", "Weekends", "Custom"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reminder time (optional)</span>
            <input
              type="time"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </label>
          <fieldset className="colour-picker">
            <legend>Category colour</legend>
            {colours.map((c) => (
              <button
                type="button"
                aria-label={`Choose ${c}`}
                className={colour === c ? "active" : ""}
                style={{ background: c }}
                key={c}
                onClick={() => setColour(c)}
              />
            ))}
          </fieldset>
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={frequency === "Custom" && customDays.length === 0}>{habit ? "Save changes" : "Create habit"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function HabitsDashboard() {
  const { items: habits, setItems: setHabits } =
      useCloudCollection<Habit>("habits"),
    [editing, setEditing] = useState<Habit | "new" | null>(null),
    [monthOffset, setMonthOffset] = useState(0);
  const now = new Date(),
    today = dateKey(now),
    todays = habits.filter((h) => scheduled(h, now)),
    done = todays.filter((h) => h.completions.includes(today)).length,
    pct = todays.length ? Math.round((done / todays.length) * 100) : 0;
  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => shift(startOfWeek(), i)),
    [],
  );
  const historyMonths = useMemo(() => {
      const result: { label: string; days: Date[] }[] = [],
        end = new Date(),
        cursor = new Date(end.getFullYear(), end.getMonth() - 11, 1, 12);
      while (cursor <= end) {
        const year = cursor.getFullYear(),
          month = cursor.getMonth();
        result.push({
          label: cursor.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          days: Array.from(
            { length: new Date(year, month + 1, 0).getDate() },
            (_, i) => new Date(year, month, i + 1, 12),
          ),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return result;
    }, []),
    month = historyMonths[Math.max(0, historyMonths.length - 1 - monthOffset)];
  const toggle = (h: Habit, d = today) =>
    setHabits((xs) =>
      xs.map((x) =>
        x.id === h.id
          ? {
              ...x,
              completions: x.completions.includes(d)
                ? x.completions.filter((k) => k !== d)
                : [...x.completions, d],
            }
          : x,
      ),
    );
  return (
    <main className="app-shell">
      <AppSidebar active="habits">
        <div className="sidebar-card">
          <span>Today&apos;s rhythm</span>
          <strong>
            {done} of {todays.length} complete
          </strong>
          <div className="mini-progress">
            <i style={{ width: `${pct}%` }} />
          </div>
          <small>Small actions, kept consistently.</small>
        </div>
      </AppSidebar>
      <section className="main-content habits-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">Daily check-in</span>
            <h1>Habits &amp; Streaks</h1>
          </div>
          <button
            className="primary-button add-task"
            aria-label="Add habit"
            onClick={() => setEditing("new")}
          >
            <PlusIcon />
            <span>Add habit</span>
          </button>
        </header>
        <section className="today-panel">
          <div className="today-progress">
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(var(--accent) ${pct}%,#e5e7e2 0)`,
              }}
            >
              <span>{pct}%</span>
            </div>
            <div>
              <span className="eyebrow">Today</span>
              <h2>
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p>
                {done} of {todays.length} done
              </p>
            </div>
          </div>
          <div className="today-checklist">
            {todays.map((h) => {
              const checked = h.completions.includes(today);
              return (
                <button
                  className={checked ? "done" : ""}
                  key={h.id}
                  onClick={() => toggle(h)}
                >
                  <i
                    style={{
                      borderColor: h.colour,
                      background: checked ? h.colour : "transparent",
                    }}
                  >
                    {checked && <CheckIcon />}
                  </i>
                  <strong>{h.name}</strong>
                  <span>{checked ? "Done" : "Mark done"}</span>
                </button>
              );
            })}
          </div>
        </section>
        <div className="section-bar">
          <div>
            <h2>Your streaks</h2>
            <span>This week at a glance</span>
          </div>
        </div>
        <section className="streak-grid">
          {habits.map((h) => {
            const s = streaks(h);
            return (
              <article
                key={h.id}
                style={{ "--habit": h.colour } as React.CSSProperties}
              >
                <header><i /><div><span>{h.frequency}</span><button className="habit-edit" onClick={() => setEditing(h)}>Edit</button></div></header>
                <h3>{h.name}</h3>
                <div className="streak-numbers">
                  <div>
                    <strong>🔥 {s.current}</strong>
                    <span>Current streak</span>
                  </div>
                  <div>
                    <strong>{s.longest}</strong>
                    <span>Longest ever</span>
                  </div>
                </div>
                <div className="week-row">
                  {week.map((d) => {
                    const k = dateKey(d),
                      isDone = h.completions.includes(k),
                      isScheduled = scheduled(h, d),
                      isPast = k <= today,
                      beforeStart = Boolean(h.createdDate && k < h.createdDate);
                    return (
                      <div key={k}>
                        <span>
                          {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                        </span>
                        <button
                          aria-label={`${isDone ? "Mark incomplete" : "Mark complete"}: ${h.name} on ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                          aria-pressed={isDone}
                          disabled={!isPast}
                          className={
                            isDone ? "done" : !isPast ? "future" : !isScheduled || beforeStart ? "off" : ""
                          }
                          onClick={() => toggle(h, k)}
                        >
                          {isDone && <CheckIcon />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
        <section className="heatmap-panel">
          <div className="heatmap-header">
            <div>
              <h2>Activity history</h2>
              <span>Browse month by month</span>
            </div>
            <div className="heatmap-nav">
              <button
                disabled={monthOffset >= historyMonths.length - 1}
                onClick={() =>
                  setMonthOffset((x) =>
                    Math.min(historyMonths.length - 1, x + 1),
                  )
                }
              >
                ‹
              </button>
              <strong>{month.label}</strong>
              <button
                disabled={monthOffset === 0}
                onClick={() => setMonthOffset((x) => Math.max(0, x - 1))}
              >
                ›
              </button>
            </div>
          </div>
          <div className="heatmap-legend" aria-label="Activity history legend"><span><i className="done" />Completed</span><span><i className="missed" />Missed</span><span><i className="skipped" />Before start / excluded</span><span><i className="future" />Future</span></div>
          <div className="heatmap-scroll">
            <section className="heatmap-month">
              <div
                className="heatmap"
                style={
                  { "--month-days": month.days.length } as React.CSSProperties
                }
              >
                <div className="heatmap-days">
                  {month.days.map((d) => (
                    <span key={dateKey(d)}>{d.getDate()}</span>
                  ))}
                </div>
                {habits.map((h) => (
                  <div className="heatmap-row" key={h.id}>
                    <strong>
                      <i style={{ background: h.colour }} />
                      {h.name}
                    </strong>
                    {month.days.map((d) => {
                      const k = dateKey(d),
                        past = k <= today,
                        on = scheduled(h, d),
                        complete = h.completions.includes(k),
                        beforeStart = Boolean(h.createdDate && k < h.createdDate),
                        stateLabel = complete
                          ? "completed"
                          : !on
                            ? "skipped — not scheduled"
                            : beforeStart
                              ? "before this habit started — available to backfill"
                              : past
                                ? "missed"
                                : "future";
                      return (
                        <button
                          type="button"
                          title={`${h.name} — ${k} — ${stateLabel}`}
                          aria-label={`${complete ? "Mark incomplete" : !past ? stateLabel : "Mark complete"}: ${h.name} on ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                          aria-pressed={complete}
                          disabled={!past}
                          key={k}
                          className={
                            complete
                              ? "done"
                              : !on || beforeStart
                                ? "off"
                                : past
                                  ? "missed"
                                  : "future"
                          }
                          style={
                            complete ? { background: h.colour } : undefined
                          }
                          onClick={() => toggle(h, k)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </section>
      <MobileNavigation active="habits" />
      {editing && (
        <HabitForm
          habit={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(h) => {
            setHabits((xs) => xs.some(item => item.id === h.id) ? xs.map(item => item.id === h.id ? h : item) : [...xs, h]);
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}

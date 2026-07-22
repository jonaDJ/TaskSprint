"use client";

import { Fragment, useMemo, useState } from "react";
import { AppSidebar, MobileNavigation } from "./app-navigation";
import { ChevronRight, PlusIcon, XIcon } from "./icons";
import { useCloudCollection } from "@/lib/use-cloud-collection";
import { createId } from "@/lib/id";

type Status = "Planning" | "Active" | "Delayed" | "Completed";
type Priority = "High" | "Medium" | "Low";
type Category =
  | "Project"
  | "Goal"
  | "Book"
  | "Course"
  | "Certification"
  | "Job Search"
  | "University"
  | "Simple Task";
type ProgressType = "Pages" | "Subtasks";
type Goal = {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  startDate: string;
  targetDate: string;
  progressType: ProgressType;
  current: number;
  total: number;
  milestones: { id: string; name: string; done: boolean }[];
  completedAt?: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = createId;
const categories: Category[] = [
  "Project",
  "Goal",
  "Book",
  "Course",
  "Certification",
  "Job Search",
  "University",
  "Simple Task",
];
const progressTypes: ProgressType[] = ["Pages", "Subtasks"];
const defaultProgressMap: Record<Category, ProgressType> = {
  Project: "Subtasks",
  Goal: "Subtasks",
  Book: "Pages",
  Course: "Subtasks",
  Certification: "Subtasks",
  "Job Search": "Subtasks",
  University: "Subtasks",
  "Simple Task": "Subtasks",
};
const defaultProgress = (category: Category): ProgressType =>
  defaultProgressMap[category];
const progressFor = (g: Goal) => {
  const checklist = g.progressType === "Subtasks";
  const current = checklist
      ? g.milestones.filter((m) => m.done).length
      : g.current || 0,
    total = checklist ? g.milestones.length : g.total || 0;
  return {
    current,
    total,
    percent: total ? Math.min(100, Math.round((current / total) * 100)) : 0,
    label: `${current} of ${total} ${g.progressType.toLowerCase()}`,
  };
};
const typeClass = (category: Category) =>
  `type-${category.toLowerCase().replaceAll(" ", "-")}`;
function GoalForm({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal;
  onClose: () => void;
  onSave: (g: Goal) => void;
}) {
  const [g, setG] = useState<Goal>(
    goal || {
      id: uid(),
      title: "",
      category: "Project",
      priority: "Medium",
      status: "Planning",
      startDate: today(),
      targetDate: today(),
      progressType: "Subtasks",
      current: 0,
      total: 0,
      milestones: [],
    },
  );
  const [subtask, setSubtask] = useState("");
  const set = <K extends keyof Goal>(k: K, v: Goal[K]) =>
    setG((x) => ({ ...x, [k]: v }));
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="goal-dialog">
        <header className="dialog-header">
          <div>
            <span className="eyebrow">Finish line</span>
            <h2>{goal ? "Edit goal" : "New goal"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <XIcon />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const checklistDone =
              g.progressType === "Subtasks" &&
              g.milestones.length > 0 &&
              g.milestones.every((m) => m.done);
            const status = checklistDone ? "Completed" : g.status;
            onSave({
              ...g,
              status,
              completedAt:
                status === "Completed" ? g.completedAt || today() : undefined,
            });
          }}
        >
          <label className="field">
            <span>Title</span>
            <input
              autoFocus
              required
              value={g.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Type</span>
              <select
                value={g.category}
                onChange={(e) => {
                  const category = e.target.value as Category;
                  setG((x) => ({
                    ...x,
                    category,
                    progressType: defaultProgress(category),
                  }));
                }}
              >
                {categories.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select
                value={g.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              >
                {["High", "Medium", "Low"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={g.status}
                onChange={(e) => set("status", e.target.value as Status)}
              >
                {["Planning", "Active", "Delayed", "Completed"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Progress By</span>
              <select
                value={g.progressType}
                onChange={(e) =>
                  set("progressType", e.target.value as ProgressType)
                }
              >
                {progressTypes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {g.progressType === "Pages" && (
              <>
                <label className="field">
                  <span>Current page</span>
                  <input
                    type="number"
                    min="0"
                    value={g.current}
                    onChange={(e) => set("current", +e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Total pages</span>
                  <input
                    type="number"
                    min="0"
                    value={g.total}
                    onChange={(e) => set("total", +e.target.value)}
                  />
                </label>
              </>
            )}
            <label className="field">
              <span>Started on</span>
              <input
                type="date"
                required
                value={g.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                required
                value={g.targetDate}
                onChange={(e) => set("targetDate", e.target.value)}
              />
            </label>
          </div>
          {g.progressType === "Subtasks" && (
            <section className="subtask-editor">
              <div>
                <strong>Subtasks</strong>
                <span>
                  {g.milestones.filter((m) => m.done).length} of{" "}
                  {g.milestones.length} completed
                </span>
              </div>
              {g.milestones.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={m.done}
                    onChange={() =>
                      setG((current) => {
                        const milestones = current.milestones.map((x) =>
                            x.id === m.id ? { ...x, done: !x.done } : x,
                          ),
                          complete =
                            milestones.length > 0 &&
                            milestones.every((x) => x.done);
                        return {
                          ...current,
                          milestones,
                          status: complete
                            ? "Completed"
                            : current.status === "Completed"
                              ? "Active"
                              : current.status,
                        };
                      })
                    }
                  />
                  <span>{m.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "milestones",
                        g.milestones.filter((x) => x.id !== m.id),
                      )
                    }
                  >
                    ×
                  </button>
                </label>
              ))}
              <div className="subtask-add">
                <input
                  value={subtask}
                  onChange={(e) => setSubtask(e.target.value)}
                  placeholder="Add a subtask"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (subtask.trim()) {
                      set("milestones", [
                        ...g.milestones,
                        { id: uid(), name: subtask.trim(), done: false },
                      ]);
                      setSubtask("");
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </section>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button">Save goal</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function GoalGroup({
  title,
  goals,
  colour,
  onEdit,
  onToggle,
  onUpdate,
  onAdd,
}: {
  title: string;
  goals: Goal[];
  colour: string;
  onEdit: (g: Goal) => void;
  onToggle: (g: Goal) => void;
  onUpdate: (g: Goal) => void;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [progressOpen, setProgressOpen] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const updateMilestones = (goal: Goal, milestones: Goal["milestones"]) => {
    const complete = milestones.length > 0 && milestones.every(item => item.done);
    onUpdate({
      ...goal,
      milestones,
      status: complete ? "Completed" : goal.status === "Completed" ? "Active" : goal.status,
      completedAt: complete ? goal.completedAt || today() : undefined,
    });
  };
  return (
    <section
      className="board-group"
      style={{ "--group": colour } as React.CSSProperties}
    >
      <button className="board-group-title" onClick={() => setOpen(!open)}>
        <span><ChevronRight className={open ? "open" : ""} /></span>
        {title}
        <small>{goals.length}</small>
      </button>
      {open && (
        <div className="board-table">
          <div className="board-row board-head">
            <span />
            <span>Goal</span>
            <span>Type</span>
            <span>Progress</span>
            <span>Status</span>
            <span>Timeline</span>
            <span>Due date</span>
            <span>Priority</span>
          </div>
          {goals.map((g) => {
            const p = progressFor(g);
            return (
              <Fragment key={g.id}>
              <div
                className={`board-row ${typeClass(g.category)}`}
              >
                <span>
                  <button
                    className={`goal-check ${g.status === "Completed" ? "checked" : ""}`}
                    onClick={() => onToggle(g)}
                    aria-label={g.status === "Completed" ? "Mark active" : "Mark completed"}
                  >
                    {g.status === "Completed" && "✓"}
                  </button>
                </span>
                <strong className="board-goal-title" title={g.title}><input className="board-title-input" defaultValue={g.title} aria-label={`Goal name: ${g.title}`} onBlur={event => { const title = event.target.value.trim(); if (title && title !== g.title) onUpdate({ ...g, title }); else event.target.value = g.title; }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { event.currentTarget.value = g.title; event.currentTarget.blur(); } }} /><button type="button" onClick={() => onEdit(g)} aria-label={`Edit all details for ${g.title}`} title="Edit all details">•••</button></strong>
                <span className="board-type"><select value={g.category} onChange={e => onUpdate({ ...g, category: e.target.value as Category, progressType: defaultProgress(e.target.value as Category) })} aria-label={`Type for ${g.title}`}>{categories.map(category => <option key={category}>{category}</option>)}</select></span>
                <span className="board-progress" role="button" tabIndex={0} aria-expanded={progressOpen === g.id} aria-label={`Edit progress for ${g.title}: ${p.label}`} onClick={() => { setProgressOpen(current => current === g.id ? null : g.id); setNewSubtask(""); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setProgressOpen(current => current === g.id ? null : g.id); setNewSubtask(""); } }}>
                  <em>{p.label}</em>
                  <i>
                    <b style={{ width: `${p.percent}%` }} />
                  </i>
                  <small>{p.percent}%</small>
                </span>
                <span className={`board-status ${g.status.toLowerCase()}`}><select value={g.status} onChange={e => onUpdate({ ...g, status: e.target.value as Status })} aria-label={`Status for ${g.title}`}>{["Planning", "Active", "Delayed", "Completed"].map(status => <option key={status}>{status}</option>)}</select></span>
                <span className="board-timeline">
                  <input type="date" value={g.startDate} onChange={e => onUpdate({ ...g, startDate: e.target.value })} aria-label={`Start date for ${g.title}`} />
                  <input type="date" value={g.targetDate} onChange={e => onUpdate({ ...g, targetDate: e.target.value })} aria-label={`Due date for ${g.title}`} />
                </span>
                <span
                  className={`board-due ${g.status !== "Completed" && g.targetDate < today() ? "overdue" : ""}`}
                >
                  <input type="date" value={g.targetDate} min={g.startDate} onChange={event => onUpdate({ ...g, targetDate: event.target.value })} aria-label={`Due date for ${g.title}`} />
                </span>
                <span className={`board-priority ${g.priority.toLowerCase()}`}><select value={g.priority} onChange={e => onUpdate({ ...g, priority: e.target.value as Priority })} aria-label={`Priority for ${g.title}`}>{["High", "Medium", "Low"].map(priority => <option key={priority}>{priority}</option>)}</select></span>
              </div>
              {progressOpen === g.id && <div className="progress-dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setProgressOpen(null)}><section className="board-progress-panel" role="dialog" aria-modal="true" aria-label={`Update progress for ${g.title}`}>
                <header><div><strong>{g.progressType === "Subtasks" ? "Subtask progress" : "Page progress"}</strong><small>{p.percent}% complete</small></div><button type="button" onClick={() => setProgressOpen(null)} aria-label="Close progress editor">×</button></header>
                {g.progressType === "Pages" ? <div className="inline-number-progress"><label><span>Current page</span><input type="number" min="0" max={g.total || undefined} value={g.current} onChange={event => onUpdate({ ...g, current: Math.max(0, Number(event.target.value)) })} /></label><span>of</span><label><span>Total pages</span><input type="number" min="0" value={g.total} onChange={event => onUpdate({ ...g, total: Math.max(0, Number(event.target.value)) })} /></label></div> : <div className="inline-subtasks">
                  {g.milestones.length === 0 && <p>No subtasks yet. Add the first one below.</p>}
                  {g.milestones.map(milestone => <label key={milestone.id}><input type="checkbox" checked={milestone.done} onChange={() => updateMilestones(g, g.milestones.map(item => item.id === milestone.id ? { ...item, done: !item.done } : item))} /><span>{milestone.name}</span></label>)}
                  <form onSubmit={event => { event.preventDefault(); const name = newSubtask.trim(); if (!name) return; updateMilestones(g, [...g.milestones, { id: uid(), name, done: false }]); setNewSubtask(""); }}><input value={newSubtask} onChange={event => setNewSubtask(event.target.value)} placeholder="Add a subtask" aria-label={`New subtask for ${g.title}`} /><button type="submit">Add</button></form>
                </div>}
              </section></div>}
              </Fragment>
            );
          })}
          <button className="board-add-row" onClick={onAdd}>
            <span>＋ Add goal</span>
          </button>
        </div>
      )}
    </section>
  );
}

export function GoalsDashboard() {
  const { items: goals, setItems: setGoals } =
      useCloudCollection<Goal>("goals"),
    [editing, setEditing] = useState<Goal | "new" | null>(null),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState<Priority | "All">("All"),
    [sortAsc, setSortAsc] = useState(true);
  const shown = useMemo(
    () =>
      goals
        .filter(
          (g) =>
            g.title.toLowerCase().includes(search.toLowerCase()) &&
            (priority === "All" || g.priority === priority),
        )
        .sort(
          (a, b) =>
            (sortAsc ? 1 : -1) * a.targetDate.localeCompare(b.targetDate),
        ),
    [goals, search, priority, sortAsc],
  );
  const save = (g: Goal) => {
    setGoals((xs) =>
      xs.some((x) => x.id === g.id)
        ? xs.map((x) => (x.id === g.id ? g : x))
        : [g, ...xs],
    );
    setEditing(null);
  };
  const update = (g: Goal) => setGoals(xs => xs.map(x => x.id === g.id ? g : x));
  const toggle = (g: Goal) =>
    save({
      ...g,
      status: g.status === "Completed" ? "Active" : "Completed",
      completedAt: g.status === "Completed" ? undefined : today(),
    });
  return (
    <main className="app-shell">
      <AppSidebar active="goals">
        <div className="sidebar-card">
          <span>Weekly review</span>
          <strong>Keep your finish lines visible.</strong>
          <small>Review status and deadlines once a week.</small>
        </div>
      </AppSidebar>
      <section className="main-content board-content">
        <header className="board-page-title">
          <div>
            <span className="eyebrow">Your finish lines</span>
            <h1>Goals &amp; Projects</h1>
            <p>Plan the big things. Keep every deadline in sight.</p>
          </div>
          <button
            className="primary-button add-task"
            aria-label="Add goal"
            onClick={() => setEditing("new")}
          >
            <PlusIcon />
            <span>Add goal</span>
          </button>
        </header>
        <div className="board-toolbar">
          <label className="board-search">
            ⌕
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search goals"
            />
          </label>
          <label className="board-filter">
            ◇{" "}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | "All")}
            >
              <option value="All">All priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <button onClick={() => setSortAsc(!sortAsc)}>⇅ Due date</button>
          <span className="board-count">{shown.length} goals</span>
        </div>
        <div className="board-groups">
          <GoalGroup
            title="To-Do"
            colour="#4f83cc"
            goals={shown.filter((g) => g.status !== "Completed")}
            onEdit={setEditing}
            onToggle={toggle}
            onUpdate={update}
            onAdd={() => setEditing("new")}
          />
          <GoalGroup
            title="Completed"
            colour="#42a86b"
            goals={shown.filter((g) => g.status === "Completed")}
            onEdit={setEditing}
            onToggle={toggle}
            onUpdate={update}
            onAdd={() => setEditing("new")}
          />
        </div>
      </section>
      <MobileNavigation active="goals" />
      {editing && (
        <GoalForm
          goal={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </main>
  );
}

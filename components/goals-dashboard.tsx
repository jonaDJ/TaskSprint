"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AppSidebar, MobileNavigation } from "./app-navigation";
import { ChevronRight, PencilIcon, PlusIcon, TrashIcon, XIcon } from "./icons";
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
  workList?: "todo" | "sprint" | "later";
  sprintWeek?: string;
};
type SprintArchive = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completedAt: string;
  goals: Goal[];
  plannedCount?: number;
  carriedCount?: number;
};

const today = () => new Date().toISOString().slice(0, 10);
const weekBounds = (value = new Date()) => {
  const date = new Date(value), day = (date.getDay() + 6) % 7;
  const start = new Date(date); start.setHours(12, 0, 0, 0); start.setDate(date.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};
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
const durationDays = (start: string, end: string) => {
  const from = new Date(`${start}T12:00:00`).getTime();
  const to = new Date(`${end}T12:00:00`).getTime();
  return Number.isFinite(from) && Number.isFinite(to)
    ? Math.max(1, Math.round((to - from) / 86400000) + 1)
    : 0;
};
const typeClass = (category: Category) =>
  `type-${category.toLowerCase().replaceAll(" ", "-")}`;
function GoalForm({
  goal,
  onClose,
  onSave,
  onDelete,
}: {
  goal?: Goal;
  onClose: () => void;
  onSave: (g: Goal) => void;
  onDelete?: (id: string) => void;
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
      workList: "todo",
    },
  );
  const [subtask, setSubtask] = useState("");
  const [deleteIntent, setDeleteIntent] = useState(false);
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
              <span>Move to</span>
              <select value={g.workList || "todo"} onChange={(e) => { const workList = e.target.value as Goal["workList"]; setG(current => ({ ...current, workList, sprintWeek: workList === "sprint" ? current.sprintWeek || weekBounds().start : undefined })); }}>
                <option value="todo">To Do</option>
                <option value="sprint">This Sprint</option>
                <option value="later">Later / Backlog</option>
              </select>
            </label>
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
          {goal && onDelete && <div className="delete-zone"><div><strong>Delete issue</strong><small>This removes the issue and its subtasks.</small></div><div><button type="button" className="delete-button" onClick={() => setDeleteIntent(true)}><TrashIcon />Delete issue</button></div></div>}
          {goal && onDelete && deleteIntent && <div className="delete-confirmation" role="alertdialog" aria-labelledby="delete-goal-title"><div><strong id="delete-goal-title">Delete this issue?</strong><span>This permanently removes “{goal.title}” and cannot be undone.</span></div><div><button type="button" className="secondary-button" onClick={() => setDeleteIntent(false)}>Cancel</button><button type="button" className="confirm-delete-button" onClick={() => onDelete(goal.id)}>Yes, delete</button></div></div>}
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
  allowCompletion = false,
}: {
  title: string;
  goals: Goal[];
  colour: string;
  onEdit: (g: Goal) => void;
  onToggle: (g: Goal) => void;
  onUpdate: (g: Goal) => void;
  onAdd: () => void;
  allowCompletion?: boolean;
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
            <span>Timeline</span>
            <span>Days</span>
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
                  {allowCompletion && <button
                    className={`goal-check ${g.status === "Completed" ? "checked" : ""}`}
                    onClick={() => onToggle(g)}
                    aria-label={g.status === "Completed" ? "Mark active" : "Mark completed"}
                  >
                    {g.status === "Completed" && "✓"}
                  </button>}
                </span>
                <strong className="board-goal-title" title={g.title}><span className="board-title-text">{g.title}</span><button type="button" className="goal-edit-button" onClick={() => onEdit(g)} aria-label={`Edit ${g.title}`} title="Edit goal"><PencilIcon /></button></strong>
                <span className="board-type"><select value={g.category} onChange={e => onUpdate({ ...g, category: e.target.value as Category, progressType: defaultProgress(e.target.value as Category) })} aria-label={`Type for ${g.title}`}>{categories.map(category => <option key={category}>{category}</option>)}</select></span>
                <span className="board-progress" role="button" tabIndex={0} aria-expanded={progressOpen === g.id} aria-label={`Edit progress for ${g.title}: ${p.label}`} onClick={() => { setProgressOpen(current => current === g.id ? null : g.id); setNewSubtask(""); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setProgressOpen(current => current === g.id ? null : g.id); setNewSubtask(""); } }}>
                  <em>{p.label}</em>
                  <i>
                    <b style={{ width: `${p.percent}%` }} />
                  </i>
                  <small>{p.percent}%</small>
                </span>
                <span className="board-timeline">
                  <input type="date" value={g.startDate} onChange={e => onUpdate({ ...g, startDate: e.target.value })} aria-label={`Start date for ${g.title}`} />
                  <input type="date" value={g.targetDate} onChange={e => onUpdate({ ...g, targetDate: e.target.value })} aria-label={`Due date for ${g.title}`} />
                </span>
                <span className="board-days">{durationDays(g.startDate, g.targetDate)} {durationDays(g.startDate, g.targetDate) === 1 ? "day" : "days"}</span>
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
  const { items: records, setItems: setRecords } =
      useCloudCollection<Goal | SprintArchive>("goals"),
    [editing, setEditing] = useState<Goal | "new" | null>(null),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState<Priority | "All">("All"),
    [view, setView] = useState<"workspace" | "history">("workspace");
  const goals = records.filter((item): item is Goal => !("goals" in item));
  const archives = records.filter((item): item is SprintArchive => "goals" in item);
  const setGoals = (update: (items: Goal[]) => Goal[]) => setRecords(items => [...update(items.filter((item): item is Goal => !("goals" in item))), ...items.filter((item): item is SprintArchive => "goals" in item)]);
  useEffect(() => {
    if (records.some(item => item.id.startsWith("sample-"))) {
      setRecords(items => items.filter(item => !item.id.startsWith("sample-")));
    }
  }, [records, setRecords]);
  useEffect(() => {
    const currentWeek = weekBounds().start;
    const unassigned = records.filter((item): item is Goal => !("goals" in item) && item.workList === "sprint" && !item.sprintWeek);
    if (unassigned.length) {
      setRecords(items => items.map(item => !("goals" in item) && item.workList === "sprint" && !item.sprintWeek ? { ...item, sprintWeek: currentWeek } : item));
      return;
    }
    const expired = records.filter((item): item is Goal => !("goals" in item) && item.workList === "sprint" && Boolean(item.sprintWeek) && item.sprintWeek! < currentWeek);
    if (!expired.length) return;
    setRecords(items => {
      const active = items.filter((item): item is Goal => !("goals" in item));
      const saved = items.filter((item): item is SprintArchive => "goals" in item);
      const weeks = [...new Set(expired.map(goal => goal.sprintWeek!))];
      const newArchives = weeks.filter(week => !saved.some(archive => archive.startDate === week)).map(week => {
        const planned = expired.filter(goal => goal.sprintWeek === week);
        const completed = planned.filter(goal => goal.status === "Completed");
        const end = new Date(`${week}T12:00:00`); end.setDate(end.getDate() + 6);
        return { id: uid(), name: `Week of ${new Date(`${week}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, startDate: week, endDate: end.toISOString().slice(0, 10), completedAt: today(), goals: completed, plannedCount: planned.length, carriedCount: planned.length - completed.length } satisfies SprintArchive;
      });
      const nextGoals = active.flatMap(goal => expired.some(old => old.id === goal.id) ? goal.status === "Completed" ? [] : [{ ...goal, workList: "later" as const, status: "Planning" as const, sprintWeek: undefined, completedAt: undefined }] : [goal]);
      return [...nextGoals, ...saved, ...newArchives];
    });
  }, [records, setRecords]);
  const shown = useMemo(
    () =>
      goals
        .filter(
          (g) =>
            g.title.toLowerCase().includes(search.toLowerCase()) &&
            (priority === "All" || g.priority === priority),
        )
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
    [goals, search, priority],
  );
  const save = (g: Goal) => {
    const normalized = g.workList === "sprint" ? { ...g, sprintWeek: g.sprintWeek || weekBounds().start } : { ...g, sprintWeek: undefined };
    setGoals((xs) =>
      xs.some((x) => x.id === normalized.id)
        ? xs.map((x) => (x.id === normalized.id ? normalized : x))
        : [normalized, ...xs],
    );
    setEditing(null);
  };
  const remove = (id: string) => { setGoals(xs => xs.filter(goal => goal.id !== id)); setEditing(null); };
  const update = (g: Goal) => setGoals(xs => xs.map(x => x.id === g.id ? g : x));
  const toggle = (g: Goal) => update({ ...g, status: g.status === "Completed" ? "Active" : "Completed", completedAt: g.status === "Completed" ? undefined : today() });
  const todo = shown.filter(goal => !goal.workList || goal.workList === "todo");
  const sprint = shown.filter(goal => goal.workList === "sprint" && (!goal.sprintWeek || goal.sprintWeek === weekBounds().start));
  const later = shown.filter(goal => goal.workList === "later");
  const complete = sprint.filter(goal => goal.status === "Completed").length;
  return (
    <main className="app-shell">
      <AppSidebar active="goals">
        <div className="sidebar-card">
          <span>Current sprint</span>
          <strong>{complete} of {sprint.length} issues done</strong>
          <div className="mini-progress"><i style={{ width: `${sprint.length ? complete / sprint.length * 100 : 0}%` }} /></div>
          <small>Commit carefully. Finish what you start.</small>
        </div>
      </AppSidebar>
      <section className="main-content board-content">
        <header className="board-page-title sprint-page-title">
          <div>
            <span className="eyebrow">Weekly planning</span>
            <h1>Goals &amp; Sprints</h1>
            <p>Keep upcoming work organized and commit selected goals to this week.</p>
          </div>
          <button
            className="primary-button add-task"
            aria-label="Create issue"
            onClick={() => setEditing("new")}
          >
            <PlusIcon />
            <span>Create issue</span>
          </button>
        </header>
        <nav className="goal-workflow-tabs" aria-label="Goal workflow">
          <button className={view === "workspace" ? "active" : ""} onClick={() => setView("workspace")}><span>Goals &amp; Sprints</span><small>{shown.length}</small></button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><span>Sprint History</span><small>{archives.length}</small></button>
        </nav>
        {view !== "history" && <div className="board-toolbar sprint-toolbar">
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
          <span className="board-count">{shown.length} goals</span>
        </div>}
        {view === "workspace" ? <div className="board-groups workflow-groups">
          <GoalGroup title="To Do" colour="#3f72c3" goals={todo} onEdit={setEditing} onToggle={toggle} onUpdate={update} onAdd={() => setEditing("new")} />
          <GoalGroup title="Current Sprint" colour="#31845a" goals={sprint} onEdit={setEditing} onToggle={toggle} onUpdate={update} onAdd={() => setEditing("new")} allowCompletion />
          <GoalGroup title="Later / Backlog" colour="#c47b2c" goals={later} onEdit={setEditing} onToggle={toggle} onUpdate={update} onAdd={() => setEditing("new")} />
        </div> : <section className="sprint-history">
          {archives.map(archive => { const done = archive.goals.length, planned = archive.plannedCount || done; return <article key={archive.id} className="history-sprint"><header><div><span className="eyebrow">Weekly sprint</span><h2>{archive.name}</h2><p>{done} completed · {archive.carriedCount || 0} moved to backlog</p></div><strong>{planned ? Math.round(done / planned * 100) : 0}%</strong></header><div className="history-progress"><i style={{ width: `${planned ? done / planned * 100 : 0}%` }} /></div><div className="board-table history-table no-completion"><div className="board-row board-head"><span>Goal</span><span>Type</span><span>Progress</span><span>Timeline</span><span>Days</span><span>Priority</span></div>{archive.goals.map(goal => { const progress = progressFor(goal); return <div className={`board-row ${typeClass(goal.category)}`} key={goal.id}><strong>{goal.title}</strong><span className="board-type">{goal.category}</span><span className="board-progress"><em>{progress.label}</em><i><b style={{ width: `${progress.percent}%` }} /></i><small>{progress.percent}%</small></span><span className="board-timeline">{goal.startDate} → {goal.targetDate}</span><span className="board-days">{durationDays(goal.startDate, goal.targetDate)} {durationDays(goal.startDate, goal.targetDate) === 1 ? "day" : "days"}</span><span className={`board-priority ${goal.priority.toLowerCase()}`}>{goal.priority}</span></div>; })}</div></article>; })}
          {archives.length === 0 && <div className="history-empty"><strong>No completed sprints yet</strong><span>Completed weekly work will appear here automatically.</span><button className="secondary-button" onClick={() => setView("workspace")}>View goals &amp; sprints</button></div>}
        </section>}
      </section>
      <MobileNavigation active="goals" />
      {editing && (
        <GoalForm
          goal={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing === "new" ? undefined : remove}
        />
      )}
    </main>
  );
}

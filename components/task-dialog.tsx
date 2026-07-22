"use client";

import { useEffect, useState } from "react";
import type { CalendarTask, Repeat } from "@/lib/calendar";
import { categoryColors, formatTime, timeFromMinutes, minutesFromTime } from "@/lib/calendar";
import { createId } from "@/lib/id";
import { TrashIcon, XIcon } from "./icons";

type Props = {
  task: CalendarTask | null;
  draft: Partial<CalendarTask> | null;
  onClose: () => void;
  onSave: (task: CalendarTask, scope: "one" | "future") => string | null;
  onDelete: (id: string, scope: "one" | "future") => void;
};

const emptyTask = (): CalendarTask => ({
  id: createId(), title: "", date: "", startTime: "09:00", endTime: "09:30",
  category: "Focus", repeat: "none", status: "planned",
});

export function TaskDialog({ task, draft, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<CalendarTask>(emptyTask());
  const [error, setError] = useState("");
  const [deleteIntent, setDeleteIntent] = useState<"one" | "future" | null>(null);
  const [editScope, setEditScope] = useState<"one" | "future" | null>(null);
  const [scopeError, setScopeError] = useState(false);
  const isOpen = Boolean(task || draft);
  const isRecurring = Boolean(task && (task.seriesId || task.repeat !== "none"));

  useEffect(() => {
    setError("");
    setDeleteIntent(null);
    setEditScope(null);
    setScopeError(false);
    if (task) setForm({ ...task, endDate: task.endDate || task.date });
    else if (draft) setForm({ ...emptyTask(), ...draft, endDate: draft.endDate || draft.date || "" });
  }, [task, draft]);

  if (!isOpen) return null;

  const update = <K extends keyof CalendarTask>(key: K, value: CalendarTask[K]) => setForm((old) => ({ ...old, [key]: value }));
  const timeOptions = Array.from({ length: 41 }, (_, index) => timeFromMinutes(4 * 60 + index * 30));
  const handleStart = (startTime: string) => {
    setForm((old) => ({
      ...old,
      startTime,
      endTime: minutesFromTime(old.endTime) > minutesFromTime(startTime)
        ? old.endTime
        : timeFromMinutes(minutesFromTime(startTime) + 30),
    }));
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="dialog-header">
          <div><span className="eyebrow">{task ? "Task details" : "New time block"}</span><h2 id="dialog-title">{task ? "Edit task" : "Plan a task"}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><XIcon /></button>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); if (isRecurring && !editScope) { setScopeError(true); return; } if (form.title.trim()) { const message = onSave({ ...form, title: form.title.trim() }, editScope || "future"); setError(message || ""); } }}>
          {isRecurring && <fieldset className={`edit-scope ${scopeError ? "has-error" : ""}`}><legend>Apply changes to</legend><button type="button" className={editScope === "one" ? "selected" : ""} onClick={() => { setEditScope("one"); setScopeError(false); }}><strong>Only this occurrence</strong><small>The rest of the repeating series stays unchanged.</small></button><button type="button" className={editScope === "future" ? "selected" : ""} onClick={() => { setEditScope("future"); setScopeError(false); }}><strong>This and future</strong><small>Earlier occurrences keep their existing details.</small></button>{scopeError && <p>Please select where to apply your changes before saving.</p>}</fieldset>}
          <label className="field task-title-field"><span>Task title</span><input autoFocus value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="What are you working on?" required /></label>
          <div className="schedule-editor">
            <label className="field"><span>Start date</span><input type="date" value={form.date} onChange={(e) => setForm((old) => ({ ...old, date: e.target.value, endDate: !old.endDate || old.endDate < e.target.value ? e.target.value : old.endDate }))} required /></label>
            <label className="field"><span>End date</span><input type="date" value={form.endDate || form.date} min={form.date} onChange={(e) => update("endDate", e.target.value)} required /></label>
            <label className="field"><span>Starts</span><select value={form.startTime} onChange={(e) => handleStart(e.target.value)} required>{timeOptions.slice(0, -1).map((time) => <option key={time} value={time}>{formatTime(time)}</option>)}</select></label>
            <label className="field"><span>Ends</span><select value={form.endTime} onChange={(e) => update("endTime", e.target.value)} required>{timeOptions.filter((time) => minutesFromTime(time) > minutesFromTime(form.startTime)).map((time) => <option key={time} value={time}>{formatTime(time)}</option>)}</select></label>
          </div>
          <fieldset className="choice-field"><legend>Category</legend><div className="category-picker">{Object.entries(categoryColors).map(([name, color]) => <button type="button" key={name} className={form.category === name ? "selected" : ""} onClick={() => update("category", name)}><i style={{ background: color }} />{name}</button>)}</div></fieldset>
          <label className="field repeat-field"><span>Repeat</span><select value={form.repeat} onChange={(e) => update("repeat", e.target.value as Repeat)}><option value="none">Does not repeat</option><option value="daily">Every day</option><option value="weekdays">Every weekday (Mon–Fri)</option><option value="weekly">Every week on this day</option></select>{form.repeat !== "none" && <small className="field-hint">Repeats through the selected end date.</small>}</label>
          {error && <div className="form-error" role="alert"><strong>Time conflict</strong><span>{error}</span></div>}
          {task && <div className="delete-zone"><div><strong>{task.seriesId ? "Delete repeating task" : "Delete task"}</strong><small>{task.seriesId ? "Choose whether to remove only this block or this block and everything after it." : "This removes the task from your calendar."}</small></div><div>{task.seriesId && <button type="button" className="delete-button subtle" onClick={() => setDeleteIntent("one")}><TrashIcon />This occurrence</button>}<button type="button" className="delete-button" onClick={() => setDeleteIntent(task.seriesId ? "future" : "one")}><TrashIcon />{task.seriesId ? "This and future" : "Delete task"}</button></div></div>}
          {task && deleteIntent && <div className="delete-confirmation" role="alertdialog" aria-labelledby="delete-confirm-title"><div><strong id="delete-confirm-title">Are you sure?</strong><span>{task.seriesId && deleteIntent === "future" ? "This occurrence and every future occurrence will be permanently removed." : task.seriesId ? "Only this occurrence will be permanently removed. The rest of the series will remain." : "This task will be permanently removed from your calendar."}</span></div><div><button type="button" className="secondary-button" onClick={() => setDeleteIntent(null)}>Cancel</button><button type="button" className="confirm-delete-button" onClick={() => onDelete(task.id, deleteIntent)}>Yes, delete</button></div></div>}
          <footer className="dialog-actions">
            <span />
            <div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{task ? "Save changes" : "Add to calendar"}</button></div>
          </footer>
        </form>
      </section>
    </div>
  );
}

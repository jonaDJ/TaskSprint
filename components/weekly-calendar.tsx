"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, CalendarTask, categoryColors, expandRecurringTask, formatDateKey, formatTime, minutesFromTime, startOfWeek, taskComputedStatus, timeFromMinutes } from "@/lib/calendar";
import { CalendarIcon, ChartIcon, CheckIcon, ChevronLeft, ChevronRight, ClockIcon, GridIcon, MoreIcon, PlusIcon, TargetIcon } from "./icons";
import { TaskDialog } from "./task-dialog";

const START_HOUR = 4;
const END_HOUR = 24;
const SLOT_HEIGHT = 32;
const STORAGE_KEY = "tasksprint.tasks.v2";
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekLabel(start: Date) {
  const end = addDays(start, 6);
  const monthA = start.toLocaleDateString("en-US", { month: "short" });
  const monthB = end.toLocaleDateString("en-US", { month: "short" });
  return `${monthA} ${start.getDate()}${monthA !== monthB ? ` – ${monthB} ${end.getDate()}` : ` – ${end.getDate()}`}, ${end.getFullYear()}`;
}

function timeSlots() {
  return Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, index) => {
    const total = START_HOUR * 60 + index * 30;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  });
}

export function WeeklyCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [draft, setDraft] = useState<Partial<CalendarTask> | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [dragMessage, setDragMessage] = useState("");
  const [resizeState, setResizeState] = useState<{ id: string; startY: number; originalEnd: number; previewEnd: number } | null>(null);
  const [mobileDay, setMobileDay] = useState(() => Math.max(0, (new Date().getDay() || 7) - 1));
  const [now, setNow] = useState(() => new Date());
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setTasks(JSON.parse(stored) as CalendarTask[]); }
      catch { setTasks([]); }
    } else setTasks([]);
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks, ready]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!resizeState) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      setResizeState((current) => {
        if (!current) return null;
        const task = tasks.find((item) => item.id === current.id);
        if (!task) return null;
        const slotChange = Math.round((event.clientY - current.startY) / SLOT_HEIGHT);
        const minimum = minutesFromTime(task.startTime) + 30;
        const previewEnd = Math.max(minimum, Math.min(END_HOUR * 60, current.originalEnd + slotChange * 30));
        return { ...current, previewEnd };
      });
    };
    const handleUp = () => {
      const current = resizeState;
      if (!current) return;
      const task = tasks.find((item) => item.id === current.id);
      if (!task) { setResizeState(null); return; }
      const conflict = tasks.find((item) => item.id !== task.id && item.date === task.date
        && minutesFromTime(task.startTime) < minutesFromTime(item.endTime)
        && current.previewEnd > minutesFromTime(item.startTime));
      if (conflict) setDragMessage(`Cannot resize — “${conflict.title}” already uses that time.`);
      else {
        setTasks((all) => all.map((item) => item.id === task.id ? { ...item, endTime: timeFromMinutes(current.previewEnd), endDate: item.date, repeat: "none", seriesId: undefined } : item));
        setDragMessage(`Resized “${task.title}” to end at ${formatTime(timeFromMinutes(current.previewEnd))}.`);
      }
      setResizeState(null);
    };
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => { window.removeEventListener("pointermove", handleMove); window.removeEventListener("pointerup", handleUp); };
  }, [resizeState, tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => days.some((day) => task.date === formatDateKey(day))), [tasks, days]);
  const complete = visibleTasks.filter((task) => task.status === "completed").length;
  const missed = visibleTasks.filter((task) => taskComputedStatus(task, now) === "missed").length;
  const completion = visibleTasks.length ? Math.round((complete / visibleTasks.length) * 100) : 0;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeTop = (nowMinutes - START_HOUR * 60) / 30 * SLOT_HEIGHT;
  const currentTimeVisible = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  const saveTask = (next: CalendarTask, scope: "one" | "future") => {
    const previous = tasks.find((item) => item.id === next.id);
    const seriesId = previous?.seriesId || next.seriesId;
    const editOne = Boolean(previous && scope === "one" && (previous.seriesId || previous.repeat !== "none"));
    const singleOccurrence: CalendarTask = { ...next, date: next.date, endDate: next.date, repeat: "none", seriesId: undefined };
    const candidates = editOne ? [singleOccurrence] : expandRecurringTask({ ...next, seriesId });
    const existing = tasks.filter((item) => editOne ? item.id !== next.id : seriesId ? item.seriesId !== seriesId : item.id !== next.id);
    const conflict = candidates.find((candidate) => existing.some((item) =>
      item.date === candidate.date
      && minutesFromTime(candidate.startTime) < minutesFromTime(item.endTime)
      && minutesFromTime(candidate.endTime) > minutesFromTime(item.startTime)
    ));
    if (conflict) {
      const blocking = existing.find((item) =>
        item.date === conflict.date
        && minutesFromTime(conflict.startTime) < minutesFromTime(item.endTime)
        && minutesFromTime(conflict.endTime) > minutesFromTime(item.startTime)
      );
      return `“${blocking?.title || "Another task"}” already occupies ${formatTime(blocking?.startTime || conflict.startTime)}–${formatTime(blocking?.endTime || conflict.endTime)} on ${new Date(`${conflict.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}.`;
    }
    setTasks((all) => {
      if (editOne) return all.map((item) => item.id === next.id ? singleOccurrence : item);
      const withoutPrevious = all.filter((item) => seriesId
        ? item.seriesId !== seriesId || (previous ? item.date < previous.date : false)
        : item.id !== next.id);
      return [...withoutPrevious, ...candidates];
    });
    setSelectedTask(null); setDraft(null);
    return null;
  };
  const deleteTask = (id: string, scope: "one" | "future") => { setTasks((all) => { const selected = all.find((item) => item.id === id); if (!selected || scope === "one" || !selected.seriesId) return all.filter((item) => item.id !== id); return all.filter((item) => item.seriesId !== selected.seriesId || item.date < selected.date); }); setSelectedTask(null); };
  const toggleComplete = (id: string) => setTasks((all) => all.map((task) => task.id === id ? { ...task, status: task.status === "completed" ? "planned" : "completed" } : task));
  const openSlot = (date: Date, time: string) => setDraft({ date: formatDateKey(date), startTime: time, endTime: `${String(Math.floor((minutesFromTime(time) + 30) / 60)).padStart(2, "0")}:${String((minutesFromTime(time) + 30) % 60).padStart(2, "0")}` });
  const rescheduleTask = (id: string, date: string, startTime: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const duration = minutesFromTime(task.endTime) - minutesFromTime(task.startTime);
    const endMinutes = minutesFromTime(startTime) + duration;
    if (endMinutes > END_HOUR * 60) {
      setDragMessage("That task would end after midnight. Choose an earlier time.");
      return;
    }
    const endTime = timeFromMinutes(endMinutes);
    const conflict = tasks.find((item) => item.id !== id && item.date === date
      && minutesFromTime(startTime) < minutesFromTime(item.endTime)
      && endMinutes > minutesFromTime(item.startTime));
    if (conflict) {
      setDragMessage(`Cannot move there — “${conflict.title}” already uses that time.`);
      return;
    }
    setTasks((all) => all.map((item) => item.id === id ? { ...item, date, endDate: date, startTime, endTime, repeat: "none", seriesId: undefined, status: "planned" } : item));
    setDragMessage(`Moved “${task.title}” to ${formatTime(startTime)}.`);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><CheckIcon /></span><span>TaskSprint</span></div>
        <nav>
         
          <a className="active" href="#"><CalendarIcon />Calendar</a>
          <a href="#"><TargetIcon />Sprint</a>
          <a href="#"><ChartIcon />Reports</a>
        </nav>
        <div className="sidebar-card"><span>This week</span><strong>{completion}% complete</strong><div className="mini-progress"><i style={{ width: `${completion}%` }} /></div><small>{complete} of {visibleTasks.length} blocks done</small></div>
        <div className="profile"><span>JD</span><div><strong>Jonathan</strong><small>Personal workspace</small></div><MoreIcon /></div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">Plan with intention</span><h1>Weekly calendar</h1></div>
          <button className="primary-button add-task" onClick={() => openSlot(days[mobileDay], "09:00")}><PlusIcon />Add task</button>
        </header>

        <section className="summary-row">
          <div className="week-controls"><button className="icon-button" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft /></button><button className="today-button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button><button className="icon-button" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight /></button><strong>{weekLabel(weekStart)}</strong></div>
          <div className="summary-stats"><span><i className="dot completed" />{complete} completed</span><span><i className="dot missed" />{missed} missed</span><span><i className="dot planned" />{Math.max(0, visibleTasks.length - complete - missed)} planned</span></div>
        </section>

        <div className="mobile-days" aria-label="Choose day">{days.map((day, index) => <button key={day.toISOString()} className={mobileDay === index ? "active" : ""} onClick={() => setMobileDay(index)}><span>{weekDays[index]}</span><strong>{day.getDate()}</strong></button>)}</div>

        <section className="calendar-frame">
          <div className="calendar-scroll">
            <div className="calendar-header"><div className="time-zone">EST</div><div className="day-headings">{days.map((day, index) => { const today = formatDateKey(day) === formatDateKey(new Date()); return <div className={`day-heading day-${index} ${today ? "today" : ""}`} key={day.toISOString()}><span>{weekDays[index]}</span><strong>{day.getDate()}</strong>{today && <small>Today</small>}</div>; })}</div></div>
            <div className="calendar-body">
            <div className="time-column">{timeSlots().map((time, index) => <div key={time} style={{ top: index * SLOT_HEIGHT - 8 }}>{index % 2 === 0 ? formatTime(time).replace(":00", "") : ""}</div>)}{currentTimeVisible && <div className="current-time-label" style={{ top: currentTimeTop - 8 }}>{formatTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)}</div>}</div>
            <div className="days-grid">{days.map((day, dayIndex) => <div className={`day-column day-${dayIndex} ${formatDateKey(day) === formatDateKey(now) ? "current-day" : ""} ${mobileDay === dayIndex ? "mobile-active" : ""}`} key={day.toISOString()}>{timeSlots().slice(0, -1).map((time) => { const targetKey = `${formatDateKey(day)}-${time}`; return <button key={time} className={`time-slot ${dragTarget === targetKey ? "drag-target" : ""}`} aria-label={`Add task ${formatDateKey(day)} ${time}`} onClick={() => openSlot(day, time)} onDragOver={(event) => { event.preventDefault(); setDragTarget(targetKey); }} onDragLeave={() => setDragTarget((current) => current === targetKey ? null : current)} onDrop={(event) => { event.preventDefault(); const id = draggedTaskId || event.dataTransfer.getData("text/task-id"); if (id) rescheduleTask(id, formatDateKey(day), time); setDraggedTaskId(null); setDragTarget(null); }} />; })}{visibleTasks.filter((task) => task.date === formatDateKey(day)).map((task) => { const taskTop = (minutesFromTime(task.startTime) - START_HOUR * 60) / 30 * SLOT_HEIGHT; const renderedEnd = resizeState?.id === task.id ? resizeState.previewEnd : minutesFromTime(task.endTime); const height = Math.max(SLOT_HEIGHT, (renderedEnd - minutesFromTime(task.startTime)) / 30 * SLOT_HEIGHT); const status = taskComputedStatus(task, now); const isActive = task.date === formatDateKey(now) && nowMinutes >= minutesFromTime(task.startTime) && nowMinutes < renderedEnd && status !== "completed"; const color = categoryColors[task.category] || categoryColors.Focus; return <article draggable={!resizeState} key={task.id} className={`calendar-task ${resizeState?.id === task.id ? "resizing" : ""} ${draggedTaskId === task.id ? "dragging" : ""} ${status} ${isActive ? "in-progress" : ""}`} style={{ top: taskTop, height, "--task-color": color } as React.CSSProperties} onDragStart={(event) => { setDraggedTaskId(task.id); setDragMessage(""); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/task-id", task.id); }} onDragEnd={() => { setDraggedTaskId(null); setDragTarget(null); }} onClick={() => setSelectedTask(task)} title={`${task.title} · ${formatTime(task.startTime)}–${formatTime(task.endTime)}`}><button className="task-check" onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }} aria-label={status === "completed" ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>{status === "completed" && <CheckIcon />}</button><strong>{task.title}</strong>{isActive && <span className="focus-now">Focus now</span>}<button type="button" className="resize-handle" aria-label={`Resize ${task.title}`} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); setDragMessage(""); setResizeState({ id: task.id, startY: event.clientY, originalEnd: minutesFromTime(task.endTime), previewEnd: minutesFromTime(task.endTime) }); }} /></article>; })}{formatDateKey(day) === formatDateKey(now) && currentTimeVisible && <div className="current-time-line" style={{ top: currentTimeTop }} />}</div>)}</div>
            </div>
          </div>
        </section>
        <footer className="calendar-hint"><ClockIcon /><span>Click any 30-minute block to create a task. Past unfinished blocks are marked missed automatically.</span></footer>
      </section>
      <TaskDialog task={selectedTask} draft={draft} onClose={() => { setSelectedTask(null); setDraft(null); }} onSave={saveTask} onDelete={deleteTask} />
      {dragMessage && <button className="calendar-toast" onClick={() => setDragMessage("")} aria-label="Dismiss message">{dragMessage}</button>}
    </main>
  );
}

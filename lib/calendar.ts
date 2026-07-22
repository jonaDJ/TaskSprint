import { createId } from "./id";

export type Repeat = "none" | "daily" | "weekdays" | "mon-thu" | "weekends" | "weekly";
export type TaskStatus = "planned" | "completed" | "missed" | "delayed";

export type CalendarTask = {
  id: string;
  seriesId?: string;
  title: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  category: string;
  repeat: Repeat;
  status: TaskStatus;
};

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function expandRecurringTask(task: CalendarTask): CalendarTask[] {
  if (task.repeat === "none") return [{ ...task, seriesId: undefined }];

  const seriesId = task.seriesId || task.id;
  const firstDate = dateFromKey(task.date);
  const lastDate = dateFromKey(task.endDate || task.date);
  const daysAhead = Math.max(0, Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000));
  const occurrences: CalendarTask[] = [];

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = addDays(firstDate, offset);
    const day = date.getDay();
    const matches = task.repeat === "daily"
      || (task.repeat === "weekdays" && day >= 1 && day <= 5)
      || (task.repeat === "mon-thu" && day >= 1 && day <= 4)
      || (task.repeat === "weekends" && (day === 0 || day === 6))
      || (task.repeat === "weekly" && offset % 7 === 0);

    if (matches) {
      occurrences.push({
        ...task,
        id: offset === 0 ? task.id : createId(),
        seriesId,
        date: formatDateKey(date),
        status: offset === 0 ? task.status : "planned",
      });
    }
  }

  return occurrences;
}

export const categoryColors: Record<string, string> = {
  General: "#a7ada9",
  Wellness: "#89d4c7",
  Personal: "#a8b8ff",
  Career: "#f7b267",
  Learning: "#d2a8ff",
  Focus: "#80c7ff",
};

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

export function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(total: number) {
  const safe = Math.max(0, Math.min(total, 24 * 60));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function taskComputedStatus(task: CalendarTask, now: Date): TaskStatus {
  if (task.status !== "planned") return task.status;
  const end = new Date(`${task.date}T${task.endTime}:00`);
  return end < now ? "missed" : "planned";
}

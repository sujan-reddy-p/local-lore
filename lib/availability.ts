import type { LoreItem } from "./types";

const calendarDay = (date: Date) => date.toISOString().slice(0, 10);

export function missionSchedule(item: LoreItem) {
  if (item.schedule) return item.schedule;
  if (item.timeSlot === "Weekend") return { kind: "recurring" as const, daysOfWeek: [0, 6] };
  return { kind: "evergreen" as const };
}

export function isAvailableOn(item: LoreItem, date: Date) {
  const schedule = missionSchedule(item);
  const day = calendarDay(date);
  if (schedule.expiresAt && day > schedule.expiresAt) return false;
  if (schedule.startsAt && day < schedule.startsAt) return false;
  if (schedule.endsAt && day > schedule.endsAt) return false;
  if (schedule.kind === "scheduled") return schedule.dates?.includes(day) ?? false;
  if (schedule.daysOfWeek?.length) return schedule.daysOfWeek.includes(date.getDay());
  return true;
}

export function dateChoices(from = new Date(), count = 7) {
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function dateLabel(date: Date, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export function dateKey(date: Date) {
  return calendarDay(date);
}

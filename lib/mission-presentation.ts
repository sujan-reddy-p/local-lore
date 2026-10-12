import type { LoreItem } from "./types";

const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });
const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });
const localTime = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });

/** Display sourced occurrence dates in the catalog timezone, never the visitor's timezone. */
export function missionWhen(item: LoreItem): string {
  const schedule = item.schedule;
  if (schedule?.startsAt) {
    const start = new Date(schedule.startsAt);
    if (!Number.isNaN(start.getTime())) return `${day.format(start)} · ${time.format(start)}`;
  }
  if (schedule?.dates?.[0]) {
    const date = new Date(`${schedule.dates[0]}T12:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      const clock = item.time.match(/^\d{4}-\d{2}-\d{2} ([0-2]\d:[0-5]\d)$/)?.[1];
      return clock ? `${day.format(date)} · ${localTime.format(new Date(`2000-01-01T${clock}:00Z`))}` : day.format(date);
    }
  }
  return "Check dates";
}

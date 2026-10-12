import type { LoreItem } from "./types";

const TIME_ZONE = "America/Los_Angeles";
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

type CalendarParts = { year: number; month: number; day: number };

function calendarParts(date: Date): CalendarParts {
  const parts = Object.fromEntries(
    dayFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function calendarDay(date: Date) {
  const { year, month, day } = calendarParts(date);
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function calendarDayOfWeek(date: Date) {
  const weekday = weekdayFormatter.format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function validCalendarDay(value: string | undefined) {
  if (!value) return undefined;
  if (DAY_PATTERN.test(value)) {
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : calendarDay(new Date(timestamp));
}

function dateFromCalendarDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  // UTC noon remains on this SF calendar day across daylight-saving changes.
  // Consumers derive keys and weekdays in TIME_ZONE, never the browser zone.
  return new Date(Date.UTC(year, month - 1, date, 12));
}

function addCalendarDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, date + amount, 12));
  return result.toISOString().slice(0, 10);
}

export function missionSchedule(item: LoreItem) {
  if (item.schedule) return item.schedule;
  if (item.timeSlot === "Weekend") return { kind: "recurring" as const, daysOfWeek: [0, 6] };
  return { kind: "evergreen" as const };
}

export function isAvailableOn(item: LoreItem, date: Date) {
  const schedule = missionSchedule(item);
  const day = calendarDay(date);
  const expiresAt = validCalendarDay(schedule.expiresAt);
  const startsAt = validCalendarDay(schedule.startsAt);
  const endsAt = validCalendarDay(schedule.endsAt);
  if (expiresAt && day > expiresAt) return false;
  if (startsAt && day < startsAt) return false;
  if (endsAt && day > endsAt) return false;
  if (schedule.kind === "scheduled") return schedule.dates?.includes(day) ?? false;
  if (schedule.daysOfWeek?.length) return schedule.daysOfWeek.includes(calendarDayOfWeek(date));
  return true;
}
export function isExpired(item: LoreItem, referenceDate: Date) {
  const today = calendarDay(referenceDate);
  const schedule = missionSchedule(item);
  const expiresAt = validCalendarDay(schedule.expiresAt);
  if (expiresAt && expiresAt < today) return true;

  const endsAtValue = schedule.endsAt;
  if (endsAtValue && !DAY_PATTERN.test(endsAtValue)) {
    const endsAt = Date.parse(endsAtValue);
    if (!Number.isNaN(endsAt) && endsAt < referenceDate.getTime()) return true;
  }

  const dates = schedule.dates;
  return Boolean(dates?.length && dates.every(date => {
    const validDate = validCalendarDay(date);
    return validDate !== undefined && validDate < today;
  }));
}


export function dateChoices(from = new Date(), count = 7) {
  const start = calendarDay(from);
  return Array.from({ length: count }, (_, index) => dateFromCalendarDay(addCalendarDays(start, index)));
}

export function discoveryDates(selection: string, reference: Date) {
  if (selection === "all") return [];
  const referenceDay = calendarDay(reference);
  if (DAY_PATTERN.test(selection)) {
    const candidate = dateFromCalendarDay(selection);
    if (calendarDay(candidate) === selection) return [candidate];
    return [];
  }
  if (selection !== "weekend") return [];
  const weekday = calendarDayOfWeek(reference);
  const daysUntilSaturday = weekday === 0 ? 6 : 6 - weekday;
  if (weekday === 6) return [dateFromCalendarDay(referenceDay), dateFromCalendarDay(addCalendarDays(referenceDay, 1))];
  if (weekday === 0) return [dateFromCalendarDay(referenceDay)];
  const saturday = addCalendarDays(referenceDay, daysUntilSaturday);
  return [dateFromCalendarDay(saturday), dateFromCalendarDay(addCalendarDays(saturday, 1))];
}

export function dateLabel(date: Date, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return weekdayFormatter.format(date);
}

export function dateKey(date: Date) {
  return calendarDay(date);
}

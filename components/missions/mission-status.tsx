import type { LoreItem, MissionSchedule } from "@/lib/types";

const sourceLabels: Record<LoreItem["source"]["status"], string> = {
  "curated-seed": "Curated idea",
  "verified-live": "Verified listing",
  "agentic-directory": "Source directory",
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});
const instantFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
  timeZoneName: "short",
});
const dateOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function missionStatusLabel(item: LoreItem): string {
  return sourceLabels[item.source.status] ?? "Source directory";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: unknown, includeTime = false): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnly) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : dateOnlyFormatter.format(parsed);
  }
  const parsed = parseDate(value);
  if (!parsed) return null;
  return (includeTime ? instantFormatter : dateFormatter).format(parsed);
}


function scheduleKindLabel(schedule: MissionSchedule): string {
  switch (schedule.kind) {
    case "recurring": return "Recurring";
    case "scheduled": return "Scheduled";
    case "seasonal": return "Seasonal";
    case "conditions": return "Conditions-dependent";
    default: return "Ongoing";
  }
}

function scheduleDetails(item: LoreItem): string[] {
  const schedule = item.schedule;
  if (!schedule) return ["Schedule not confirmed"];
  const details = [`Schedule: ${scheduleKindLabel(schedule)}`];

  if (schedule.daysOfWeek?.length) {
    const days = schedule.daysOfWeek.filter(day => day >= 0 && day <= 6).map(day => dayLabels[day]);
    if (days.length) details.push(`Days: ${days.join(", ")}`);
  }

  if (schedule.dates?.length) {
    const dates = schedule.dates.map(date => formatDate(date)).filter((date): date is string => Boolean(date));
    if (dates.length) details.push(`Dates: ${dates.join(", ")}`);
  }

  const start = formatDate(schedule.startsAt, true);
  const end = formatDate(schedule.endsAt, true);
  const expires = formatDate(schedule.expiresAt, false);
  if (start && end) details.push(`Scheduled: ${start} – ${end}`);
  else if (start) details.push(`Starts: ${start}`);
  else if (end) details.push(`Ends: ${end}`);
  if (expires) details.push(`Through: ${expires}`);

  return details;
}

export function MissionStatus({ item, compact = false }: { item: LoreItem; compact?: boolean }) {
  const label = missionStatusLabel(item);
  if (compact) {
    return <span className="mission-status mission-status--compact" aria-label={`Status: ${label}`}>{label}</span>;
  }

  const curated = item.source.status === "curated-seed";
  return <section className="mission-status" aria-label="Mission status and source timing">
    <div className="mission-status__heading"><span className="mission-status__badge">{label}</span>{curated && <span className="mission-status__note">Inspiration, not a scheduled occurrence.</span>}</div>
    <p className="mission-status__checked">Source checked {formatDate(item.source.checkedAt) ?? "not recorded"}</p>
    <div className="mission-status__schedule">{scheduleDetails(item).map(detail => <span key={detail}>{detail}</span>)}</div>
    {curated && <p className="mission-status__confirm">Confirm dates at source.</p>}
  </section>;
}

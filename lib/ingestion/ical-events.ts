import type { StructuredSourceEvent } from "./json-ld-events";

function unfolded(value: string) {
  return value.replace(/\r?\n[ \t]/g, "");
}

function unescapeIcal(value: string) {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

function iso(value: string | undefined) {
  if (!value) return undefined;
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!compact) return undefined;
  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = compact;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${utc ? "Z" : ""}`;
}

export function extractIcalEvents(calendar: string): StructuredSourceEvent[] {
  const events: StructuredSourceEvent[] = [];
  for (const block of unfolded(calendar).split("BEGIN:VEVENT").slice(1)) {
    const fields = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;
      const key = line.slice(0, separator).split(";")[0].toUpperCase();
      fields.set(key, unescapeIcal(line.slice(separator + 1)));
    }
    const title = fields.get("SUMMARY");
    if (!title) continue;
    events.push({
      externalUrl: fields.get("URL"),
      title,
      description: fields.get("DESCRIPTION")?.slice(0, 1200),
      startsAt: iso(fields.get("DTSTART")),
      endsAt: iso(fields.get("DTEND")),
      venue: fields.get("LOCATION"),
    });
  }
  return events;
}

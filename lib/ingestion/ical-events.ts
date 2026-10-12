import type { StructuredSourceEvent } from "./json-ld-events";

type IcalProperty = { value: string; params: Map<string, string> };

function unfolded(value: string) {
  return value.replace(/\r?\n[ \t]/g, "");
}

function unescapeIcal(value: string) {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

function property(line: string): [string, IcalProperty] | undefined {
  const separator = line.indexOf(":");
  if (separator < 0) return undefined;
  const [rawName, ...rawParams] = line.slice(0, separator).split(";");
  if (!rawName) return undefined;
  const params = new Map<string, string>();
  for (const rawParam of rawParams) {
    const equal = rawParam.indexOf("=");
    if (equal < 0) continue;
    params.set(rawParam.slice(0, equal).toUpperCase(), rawParam.slice(equal + 1).replace(/^"|"$/g, ""));
  }
  return [rawName.toUpperCase(), { value: unescapeIcal(line.slice(separator + 1)), params }];
}

function localDate(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second, utc] = match;
  if (!hour) return `${year}-${month}-${day}`;
  return `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}${utc ? "Z" : ""}`;
}

export function extractIcalEvents(calendar: string): StructuredSourceEvent[] {
  const events: StructuredSourceEvent[] = [];
  for (const block of unfolded(calendar).split("BEGIN:VEVENT").slice(1)) {
    const fields = new Map<string, IcalProperty>();
    for (const line of block.split(/\r?\n/)) {
      const parsed = property(line);
      if (parsed) fields.set(parsed[0], parsed[1]);
    }
    const summary = fields.get("SUMMARY")?.value;
    if (!summary) continue;
    const start = fields.get("DTSTART");
    const end = fields.get("DTEND");
    events.push({
      externalId: fields.get("UID")?.value,
      externalUrl: fields.get("URL")?.value,
      title: summary,
      description: fields.get("DESCRIPTION")?.value.slice(0, 4000),
      startsAt: localDate(start?.value),
      endsAt: localDate(end?.value),
      timezone: start?.params.get("TZID"),
      endsTimezone: end?.params.get("TZID"),
      venue: fields.get("LOCATION")?.value,
    });
  }
  return events;
}

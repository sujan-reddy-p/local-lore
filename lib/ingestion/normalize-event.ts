import { createHash } from "node:crypto";
import type { StructuredSourceEvent } from "./json-ld-events";

export type EventSourceIdentity = {
  id: string;
  key: string;
  name: string;
  canonicalUrl: string;
  timezone: string;
};

export type NormalizedEventOccurrence = {
  id: string;
  sourceId: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  venue?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  price?: number;
  currency?: string;
  confidence: number;
  sourceObservedAt: string;
  sourceSnapshotHash?: string;
  expiresAt?: string;
  sourceData: {
    sourceName: string;
    canonicalUrl: string;
    event: StructuredSourceEvent;
  };
};

export type EventNormalizationResult = { occurrence: NormalizedEventOccurrence } | { reason: string };

type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function localDateTime(value: string): LocalDateTime | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return undefined;
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const parts = { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) };
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
  if (
    check.getUTCFullYear() !== parts.year || check.getUTCMonth() + 1 !== parts.month || check.getUTCDate() !== parts.day ||
    check.getUTCHours() !== parts.hour || check.getUTCMinutes() !== parts.minute || check.getUTCSeconds() !== parts.second
  ) return undefined;
  return parts;
}

function zonedParts(instant: number, timezone: string): LocalDateTime | undefined {
  try {
    const values = new Map(new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
    return {
      year: Number(values.get("year")),
      month: Number(values.get("month")),
      day: Number(values.get("day")),
      hour: Number(values.get("hour")),
      minute: Number(values.get("minute")),
      second: Number(values.get("second")),
    };
  } catch {
    return undefined;
  }
}

function equalLocal(left: LocalDateTime | undefined, right: LocalDateTime) {
  return Boolean(left && left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute && left.second === right.second);
}

function localInstant(parts: LocalDateTime, timezone: string): string | undefined {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let guess = target;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const observed = zonedParts(guess, timezone);
    if (!observed) return undefined;
    const wallTime = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
    const corrected = target - (wallTime - guess);
    if (corrected === guess) break;
    guess = corrected;
  }
  if (!equalLocal(zonedParts(guess, timezone), parts)) return undefined;
  for (const minutes of [-120, -60, -30, 30, 60, 120]) {
    if (equalLocal(zonedParts(guess + minutes * 60_000, timezone), parts)) return undefined;
  }
  return new Date(guess).toISOString();
}

function eventInstant(value: string | undefined, timezone: string): string | undefined {
  if (!value) return undefined;
  if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const instant = new Date(value);
    return Number.isFinite(instant.getTime()) ? instant.toISOString() : undefined;
  }
  const parts = localDateTime(value);
  return parts ? localInstant(parts, timezone) : undefined;
}

function httpsUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return baseUrl;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeStructuredEvent(
  event: StructuredSourceEvent,
  source: EventSourceIdentity,
  observedAt: string,
  sourceSnapshotHash?: string | null,
): EventNormalizationResult {
  if (!event.title.trim()) return { reason: "missing-title" };
  const timezone = event.timezone ?? source.timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return { reason: "invalid-timezone" };
  }
  if (event.endsTimezone && event.endsTimezone !== timezone) return { reason: "inconsistent-timezones" };
  const startsAt = eventInstant(event.startsAt, timezone);
  if (!startsAt) return { reason: "missing-or-ambiguous-start-time" };
  const endsAt = event.endsAt ? eventInstant(event.endsAt, event.endsTimezone ?? timezone) : undefined;
  if (event.endsAt && !endsAt) return { reason: "invalid-or-ambiguous-end-time" };
  if (endsAt && Date.parse(endsAt) < Date.parse(startsAt)) return { reason: "end-before-start" };
  const longitude = event.longitude;
  const latitude = event.latitude;
  if ((longitude === undefined) !== (latitude === undefined)) return { reason: "incomplete-coordinates" };
  if (longitude !== undefined && latitude !== undefined && (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)) {
    return { reason: "invalid-coordinates" };
  }
  const canonicalUrl = httpsUrl(source.canonicalUrl, source.canonicalUrl);
  if (!canonicalUrl) return { reason: "non-https-source-url" };
  const sourceUrl = httpsUrl(event.externalUrl, canonicalUrl);
  if (!sourceUrl) return { reason: "non-https-event-url" };
  if (event.price !== undefined && (!Number.isFinite(event.price) || event.price < 0)) return { reason: "invalid-price" };
  const sourceObservedAt = new Date(observedAt);
  if (!Number.isFinite(sourceObservedAt.getTime())) return { reason: "invalid-observation-time" };

  const externalIdentity = `${event.externalId ?? sourceUrl}|${startsAt}`;
  const externalId = createHash("sha256").update(`${source.key}:${externalIdentity}`).digest("hex").slice(0, 32);
  const completeness = [event.externalId, event.externalUrl, event.venue, event.address, event.endsAt, event.price, longitude].filter((value) => value !== undefined).length;
  const confidence = Number(Math.min(1, 0.55 + completeness * 0.06).toFixed(2));
  const id = `event_${createHash("sha256").update(`${source.id}:${externalId}`).digest("hex").slice(0, 24)}`;
  return {
    occurrence: {
      id,
      sourceId: source.id,
      externalId,
      sourceUrl,
      title: event.title.trim().slice(0, 200),
      description: event.description?.trim().slice(0, 4000),
      startsAt,
      endsAt,
      timezone,
      venue: event.venue?.trim().slice(0, 300),
      address: event.address?.trim().slice(0, 500),
      longitude,
      latitude,
      price: event.price,
      currency: event.currency?.trim().toUpperCase().slice(0, 3),
      confidence,
      sourceObservedAt: sourceObservedAt.toISOString(),
      sourceSnapshotHash: sourceSnapshotHash ?? undefined,
      expiresAt: endsAt,
      sourceData: { sourceName: source.name, canonicalUrl: source.canonicalUrl, event },
    },
  };
}

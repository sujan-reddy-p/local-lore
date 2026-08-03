import { createHash } from "node:crypto";
import { loreItems } from "@/lib/seed-data";
import type { LoreItem } from "@/lib/types";
import type { StructuredSourceEvent } from "./json-ld-events";

const accents: Record<LoreItem["category"], string> = {
  Outside: "#78cfe8", Move: "#ff9b72", Make: "#67c8ff", Listen: "#f6c766",
  Eat: "#ff7866", Learn: "#a890ff", Community: "#70daa0", "After dark": "#df9bd8",
};

function comparable(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type SourceIdentity = { key: string; name: string; canonicalUrl: string };

function knownVenue(name: string | undefined, source: SourceIdentity) {
  const sourceVenues = loreItems.filter((item) => item.source.name === source.name && item.source.url === source.canonicalUrl);
  if (!name) return sourceVenues.length === 1 ? sourceVenues[0] : undefined;
  const target = comparable(name);
  return [...sourceVenues, ...loreItems].find((item) => comparable(item.venue) === target || comparable(item.venue).includes(target) || target.includes(comparable(item.venue)));
}

function dateKey(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

export type NormalizationResult = { mission: LoreItem & { externalId: string; confidence: number } } | { reason: string };

export function normalizeStructuredEvent(event: StructuredSourceEvent, source: SourceIdentity, checkedAt: string): NormalizationResult {
  const venueMission = knownVenue(event.venue, source);
  if (!venueMission) return { reason: "unknown-or-ambiguous-venue" };
  const eventDate = dateKey(event.startsAt);
  const externalId = createHash("sha256").update(`${source.key}:${event.externalUrl ?? ""}:${event.title}:${event.startsAt ?? ""}`).digest("hex").slice(0, 24);
  const category = venueMission.category;
  return {
    mission: {
      ...venueMission,
      id: `live_${externalId}`,
      externalId,
      title: event.title.slice(0, 90),
      kicker: venueMission.kicker,
      description: event.description ?? venueMission.description,
      why: venueMission.why,
      time: event.startsAt ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }).format(new Date(event.startsAt)) : "Check organizer for current schedule",
      timeSlot: event.startsAt ? "Tonight" : venueMission.timeSlot,
      price: event.price ?? venueMission.price,
      source: { name: source.name, url: event.externalUrl ?? source.canonicalUrl, status: "verified-live", checkedAt },
      schedule: eventDate ? { kind: "scheduled", dates: [eventDate], startsAt: event.startsAt, endsAt: event.endsAt, expiresAt: dateKey(event.endsAt) ?? eventDate } : { kind: "evergreen" },
      accent: accents[category],
      image: undefined,
      confidence: event.startsAt && event.venue ? 0.9 : 0.72,
    },
  };
}

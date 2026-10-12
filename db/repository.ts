import { and, asc, eq, getTableColumns, gte, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { candidateDecisions, eventOccurrences, ingestionRuns, missions, sourceObservations, sources } from "@/db/schema";
import type { LoreItem, MissionSourceStatus } from "@/lib/types";
type StoredMission = typeof missions.$inferSelect;

// Accent is a presentation token, not source data. Persisted catalog rows use
// this stable category palette so database-backed missions retain the same
// expressive map-zone language as the static seed catalog.
const categoryAccents: Record<LoreItem["category"], string> = {
  Outside: "#78cfe8",
  Move: "#ff9b72",
  Make: "#67c8ff",
  Listen: "#f6c766",
  Eat: "#ff7866",
  Learn: "#a890ff",
  Community: "#70daa0",
  "After dark": "#df9bd8",
};

function missionFromRow(row: StoredMission): LoreItem {
  return {
    id: row.id,
    title: row.title,
    kicker: row.kicker,
    description: row.description,
    why: row.why,
    category: row.category as LoreItem["category"],
    format: row.format as LoreItem["format"],
    neighborhood: row.neighborhood,
    venue: row.venue,
    coordinates: [row.longitude, row.latitude],
    zoneRadiusM: row.zoneRadiusM,
    time: row.timeLabel,
    timeSlot: row.timeSlot as LoreItem["timeSlot"],
    duration: row.durationHours,
    price: row.priceDollars,
    vibe: row.vibes as LoreItem["vibe"],
    traits: row.traits as LoreItem["traits"],
    accessibility: row.accessibility,
    source: {
      name: row.sourceName,
      url: row.sourceUrl,
      status: row.sourceStatus as MissionSourceStatus,
      checkedAt: row.sourceCheckedAt,
    },
    accent: categoryAccents[row.category as LoreItem["category"]] ?? "#78cfe8",
    distance: "Check source",
    schedule: row.schedule as LoreItem["schedule"],
    image: row.image as LoreItem["image"],
  };
}


export async function listDueSources(now = new Date(), limit = 20) {
  const db = getDb();
  return db.select().from(sources).where(and(
    eq(sources.reviewStatus, "approved_for_display"),
    eq(sources.enabled, 1),
    eq(sources.allowsAutomatedFetch, 1),
    or(isNull(sources.nextCheckAt), lte(sources.nextCheckAt, now.toISOString())),
  )).limit(limit);
}

export async function createIngestionRun(sourceId: string | null = null) {
  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(ingestionRuns).values({ id, sourceId, status: "running" });
  return id;
}

export async function finishIngestionRun(id: string, result: { status: "completed" | "failed"; fetched: number; unchanged: number; normalized: number; pendingReview: number; published: number; rejected: number; error?: string }) {
  const db = getDb();
  await db.update(ingestionRuns).set({ ...result, finishedAt: new Date().toISOString() }).where(eq(ingestionRuns.id, id));
}

export async function recordSourceObservation(input: {
  sourceId: string;
  runId: string;
  statusCode?: number;
  changed: boolean;
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string | null;
  contentType?: string | null;
  extractedEventCount?: number;
  extractedEvents?: unknown[];
  error?: string;
  nextCheckAt: string;
}) {
  const db = getDb();
  await db.insert(sourceObservations).values({
    id: crypto.randomUUID(), sourceId: input.sourceId, runId: input.runId,
    statusCode: input.statusCode, changed: input.changed ? 1 : 0, etag: input.etag,
    lastModified: input.lastModified, contentHash: input.contentHash, contentType: input.contentType,
    extractedEventCount: input.extractedEventCount ?? 0, error: input.error, extractedEvents: input.extractedEvents,
  });
  await db.update(sources).set({
    lastCheckedAt: new Date().toISOString(), nextCheckAt: input.nextCheckAt,
    etag: input.etag, lastModified: input.lastModified, contentHash: input.contentHash,
    failureCount: input.error ? 1 : 0, updatedAt: new Date().toISOString(),
  }).where(eq(sources.id, input.sourceId));
}

export async function recordCandidateDecision(input: { sourceId: string; runId: string; externalId?: string; eventId?: string | null; decision: "needs_review" | "approved" | "rejected" | "discarded"; reasons: string[]; candidate: unknown }) {
  const db = getDb();
  await db.insert(candidateDecisions).values({
    id: crypto.randomUUID(), sourceId: input.sourceId, runId: input.runId, externalId: input.externalId,
    eventId: input.eventId, decision: input.decision, reasons: input.reasons, candidate: input.candidate,
  });
}


export async function listPublishedMissions() {
  const db = getDb();
  const rows = await db.select({ mission: missions }).from(missions)
    .innerJoin(sources, eq(missions.sourceId, sources.id))
    .where(and(
      eq(missions.status, "published"),
      eq(sources.reviewStatus, "approved_for_display"),
    ));
  return rows.map(({ mission }) => missionFromRow(mission));
}

export async function getPublishedMissionCount() {
  const db = getDb();
  const rows = await db.select({ id: missions.id }).from(missions)
    .innerJoin(sources, eq(missions.sourceId, sources.id))
    .where(and(
      eq(missions.status, "published"),
      eq(sources.reviewStatus, "approved_for_display"),
    ));
  return rows.length;
}

export async function markExpiredMissionIds(ids: string[]) {
  if (!ids.length) return 0;
  const db = getDb();
  await db.update(missions).set({ status: "expired" }).where(and(eq(missions.status, "published"), inArray(missions.id, ids)));
  return ids.length;
}
export async function listPublishedEventOccurrences(now = new Date()) {
  const db = getDb();
  const instant = now.toISOString();
  return db.select(getTableColumns(eventOccurrences)).from(eventOccurrences)
    .innerJoin(sources, eq(eventOccurrences.sourceId, sources.id))
    .where(and(
      eq(eventOccurrences.status, "published"),
      eq(sources.reviewStatus, "approved_for_display"),
      or(
        gte(eventOccurrences.startsAt, instant),
        and(isNotNull(eventOccurrences.endsAt), gte(eventOccurrences.endsAt, instant)),
      ),
    )).orderBy(asc(eventOccurrences.startsAt));
}

export async function expirePastEventOccurrences(now = new Date()) {
  const db = getDb();
  const expired = await db.update(eventOccurrences).set({ status: "expired", updatedAt: now.toISOString() }).where(and(
    eq(eventOccurrences.status, "published"),
    or(
      lte(eventOccurrences.expiresAt, now.toISOString()),
      and(isNull(eventOccurrences.expiresAt), or(
        lte(eventOccurrences.endsAt, now.toISOString()),
        and(isNull(eventOccurrences.endsAt), lte(eventOccurrences.startsAt, now.toISOString())),
      )),
    ),
  )).returning({ id: eventOccurrences.id });
  return expired.length;
}

export { candidateDecisions, ingestionRuns, missions, sourceObservations, sources };

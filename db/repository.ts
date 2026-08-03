import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { candidateDecisions, ingestionRuns, missionRevisions, missions, sourceObservations, sources } from "@/db/schema";
import { loreItems } from "@/lib/seed-data";
import { sourceDirectory, sourceKey, type SourceDirectoryEntry } from "@/lib/sources/source-directory";
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

function sourceRow(source: SourceDirectoryEntry) {
  return {
    id: source.id,
    key: source.key,
    name: source.name,
    kind: source.kind,
    canonicalUrl: source.canonicalUrl,
    termsUrl: source.termsUrl ?? null,
    attribution: source.attribution,
    allowsAutomatedFetch: source.allowsAutomatedFetch ? 1 : 0,
    allowsImageReuse: source.allowsImageReuse ? 1 : 0,
    refreshHours: source.refreshHours,
    enabled: source.enabled ? 1 : 0,
  };
}

function missionValues(item: LoreItem, sourceId: string, externalId = item.id) {
  const now = new Date().toISOString();
  return {
    id: item.id,
    sourceId,
    externalId,
    canonicalUrl: item.source.url,
    title: item.title,
    kicker: item.kicker,
    description: item.description,
    why: item.why,
    category: item.category,
    format: item.format ?? null,
    neighborhood: item.neighborhood,
    venue: item.venue,
    longitude: item.coordinates[0],
    latitude: item.coordinates[1],
    zoneRadiusM: item.zoneRadiusM,
    timeLabel: item.time,
    timeSlot: item.timeSlot,
    durationHours: item.duration,
    priceDollars: item.price,
    vibes: item.vibe,
    traits: item.traits ?? [],
    accessibility: item.accessibility,
    sourceName: item.source.name,
    sourceUrl: item.source.url,
    sourceStatus: item.source.status,
    sourceCheckedAt: item.source.checkedAt,
    image: item.image ?? null,
    schedule: item.schedule ?? null,
    confidence: 1,
    status: "published",
    firstSeenAt: now,
    lastSeenAt: now,
    publishedAt: now,
    expiresAt: item.schedule?.expiresAt ? `${item.schedule.expiresAt}T23:59:59.999Z` : null,
  };
}

function missionRow(item: LoreItem) {
  const source = sourceDirectory.find((entry) => entry.key === sourceKey(item.source.name, item.source.url));
  if (!source) throw new Error(`Missing source-directory entry for ${item.source.name}`);
  return missionValues(item, source.id);
}

export async function bootstrapSeedCatalog() {
  const db = getDb();
  await db.insert(sources).values(sourceDirectory.map(sourceRow)).onConflictDoNothing();
  await db.insert(missions).values(loreItems.map(missionRow)).onConflictDoNothing();
  return { sources: sourceDirectory.length, missions: loreItems.length };
}

export async function listDueSources(now = new Date(), limit = 20) {
  const db = getDb();
  return db.select().from(sources).where(and(
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

export async function finishIngestionRun(id: string, result: { status: "completed" | "failed"; fetched: number; unchanged: number; normalized: number; published: number; rejected: number; error?: string }) {
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
  error?: string;
  nextCheckAt: string;
}) {
  const db = getDb();
  await db.insert(sourceObservations).values({
    id: crypto.randomUUID(), sourceId: input.sourceId, runId: input.runId,
    statusCode: input.statusCode, changed: input.changed ? 1 : 0, etag: input.etag,
    lastModified: input.lastModified, contentHash: input.contentHash, contentType: input.contentType,
    extractedEventCount: input.extractedEventCount ?? 0, error: input.error,
  });
  await db.update(sources).set({
    lastCheckedAt: new Date().toISOString(), nextCheckAt: input.nextCheckAt,
    etag: input.etag, lastModified: input.lastModified, contentHash: input.contentHash,
    failureCount: input.error ? 1 : 0, updatedAt: new Date().toISOString(),
  }).where(eq(sources.id, input.sourceId));
}

export async function recordCandidateDecision(input: { sourceId: string; runId: string; externalId?: string; decision: "published" | "discarded"; reasons: string[]; candidate: unknown }) {
  const db = getDb();
  await db.insert(candidateDecisions).values({
    id: crypto.randomUUID(), sourceId: input.sourceId, runId: input.runId, externalId: input.externalId,
    decision: input.decision, reasons: input.reasons, candidate: input.candidate,
  });
}

export async function upsertAgentMission(input: { sourceId: string; externalId: string; mission: LoreItem; runId: string }) {
  const db = getDb();
  const row = missionValues(input.mission, input.sourceId, input.externalId);
  const existing = await db.select().from(missions).where(and(eq(missions.sourceId, input.sourceId), eq(missions.externalId, input.externalId))).limit(1);
  if (existing[0]) {
    await db.insert(missionRevisions).values({ id: crypto.randomUUID(), missionId: existing[0].id, runId: input.runId, actor: "agent", before: existing[0], after: row });
  }
  const { id, sourceId: ignoredSourceId, externalId: ignoredExternalId, firstSeenAt, ...updates } = row;
  void ignoredSourceId;
  void ignoredExternalId;
  void firstSeenAt;
  await db.insert(missions).values(row).onConflictDoUpdate({ target: [missions.sourceId, missions.externalId], set: updates });
  return row.id;
}

export async function listPublishedMissions() {
  const db = getDb();
  const rows = await db.select().from(missions).where(eq(missions.status, "published"));
  return rows.map(missionFromRow);
}

export async function getPublishedMissionCount() {
  const db = getDb();
  const rows = await db.select({ id: missions.id }).from(missions).where(eq(missions.status, "published"));
  return rows.length;
}

export async function markExpiredMissionIds(ids: string[]) {
  if (!ids.length) return 0;
  const db = getDb();
  await db.update(missions).set({ status: "expired" }).where(and(eq(missions.status, "published"), inArray(missions.id, ids)));
  return ids.length;
}

export { candidateDecisions, ingestionRuns, missionRevisions, missions, sourceObservations, sources };

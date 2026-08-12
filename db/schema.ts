import { index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const now = () => timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow();

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  termsUrl: text("terms_url"),
  attribution: text("attribution").notNull(),
  allowsAutomatedFetch: integer("allows_automated_fetch").notNull().default(0),
  allowsImageReuse: integer("allows_image_reuse").notNull().default(0),
  refreshHours: integer("refresh_hours").notNull().default(168),
  enabled: integer("enabled").notNull().default(1),
  lastCheckedAt: timestamp("last_checked_at", { mode: "string", withTimezone: true }),
  nextCheckAt: timestamp("next_check_at", { mode: "string", withTimezone: true }),
  etag: text("etag"),
  lastModified: text("last_modified"),
  contentHash: text("content_hash"),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("sources_due_idx").on(table.enabled, table.nextCheckAt)]);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").references(() => sources.id, { onDelete: "set null" }),
  status: text("status").notNull(),
  fetched: integer("fetched").notNull().default(0),
  unchanged: integer("unchanged").notNull().default(0),
  normalized: integer("normalized").notNull().default(0),
  published: integer("published").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
  startedAt: timestamp("started_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { mode: "string", withTimezone: true }),
  error: text("error"),
}, (table) => [index("ingestion_runs_source_started_idx").on(table.sourceId, table.startedAt)]);

export const sourceObservations = pgTable("source_observations", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  runId: text("run_id").references(() => ingestionRuns.id, { onDelete: "set null" }),
  statusCode: integer("status_code"),
  changed: integer("changed").notNull().default(0),
  etag: text("etag"),
  lastModified: text("last_modified"),
  contentHash: text("content_hash"),
  contentType: text("content_type"),
  extractedEventCount: integer("extracted_event_count").notNull().default(0),
  error: text("error"),
  checkedAt: timestamp("checked_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("source_observations_source_checked_idx").on(table.sourceId, table.checkedAt)]);

export const missions = pgTable("missions", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  externalId: text("external_id").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  title: text("title").notNull(),
  kicker: text("kicker").notNull(),
  description: text("description").notNull(),
  why: text("why").notNull(),
  category: text("category").notNull(),
  format: text("format"),
  neighborhood: text("neighborhood").notNull(),
  venue: text("venue").notNull(),
  longitude: real("longitude").notNull(),
  latitude: real("latitude").notNull(),
  zoneRadiusM: integer("zone_radius_m").notNull(),
  timeLabel: text("time_label").notNull(),
  timeSlot: text("time_slot").notNull(),
  durationHours: real("duration_hours").notNull(),
  priceDollars: real("price_dollars").notNull(),
  vibes: jsonb("vibes").$type<string[]>().notNull(),
  traits: jsonb("traits").$type<string[]>().notNull(),
  accessibility: text("accessibility").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceStatus: text("source_status").notNull(),
  sourceCheckedAt: text("source_checked_at").notNull(),
  image: jsonb("image"),
  schedule: jsonb("schedule"),
  confidence: real("confidence").notNull(),
  status: text("status").notNull().default("published"),
  firstSeenAt: timestamp("first_seen_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { mode: "string", withTimezone: true }),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }),
}, (table) => [
  uniqueIndex("missions_source_external_unique").on(table.sourceId, table.externalId),
  index("missions_status_category_idx").on(table.status, table.category),
  index("missions_last_seen_idx").on(table.lastSeenAt),
]);

export const missionRevisions = pgTable("mission_revisions", {
  id: text("id").primaryKey(),
  missionId: text("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  runId: text("run_id").references(() => ingestionRuns.id, { onDelete: "set null" }),
  actor: text("actor").notNull(),
  before: jsonb("before"),
  after: jsonb("after").notNull(),
  createdAt: now(),
}, (table) => [index("mission_revisions_mission_created_idx").on(table.missionId, table.createdAt)]);

export const candidateDecisions = pgTable("candidate_decisions", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  runId: text("run_id").references(() => ingestionRuns.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  decision: text("decision").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull(),
  candidate: jsonb("candidate").notNull(),
  createdAt: now(),
}, (table) => [index("candidate_decisions_source_created_idx").on(table.sourceId, table.createdAt)]);

export const visitors = pgTable("visitors", {
  ipAddress: text("ip_address").primaryKey(),
  firstSeenAt: timestamp("first_seen_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  visitCount: integer("visit_count").notNull().default(1),
  userAgent: text("user_agent"),
});

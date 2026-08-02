import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources",{
  id:text("id").primaryKey(), key:text("key").notNull().unique(), name:text("name").notNull(), kind:text("kind").notNull(),
  canonicalUrl:text("canonical_url").notNull(), termsUrl:text("terms_url"), attribution:text("attribution").notNull(),
  allowsAutomatedFetch:integer("allows_automated_fetch",{mode:"boolean"}).notNull().default(false),
  allowsImageReuse:integer("allows_image_reuse",{mode:"boolean"}).notNull().default(false),
  refreshMinutes:integer("refresh_minutes").notNull().default(1440), enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const missions = sqliteTable("missions",{
  id:text("id").primaryKey(), sourceId:text("source_id").notNull().references(()=>sources.id), externalId:text("external_id").notNull(),
  title:text("title").notNull(), kicker:text("kicker").notNull(), description:text("description").notNull(), why:text("why").notNull(),
  category:text("category").notNull(), format:text("format").notNull(), neighborhood:text("neighborhood").notNull(), venue:text("venue").notNull(),
  longitude:real("longitude").notNull(), latitude:real("latitude").notNull(), zoneRadiusM:integer("zone_radius_m").notNull(),
  timeLabel:text("time_label").notNull(), durationHours:real("duration_hours").notNull(), priceDollars:real("price_dollars").notNull(),
  vibesJson:text("vibes_json").notNull(), traitsJson:text("traits_json").notNull().default("[]"), accessibility:text("accessibility").notNull(),
  sourceUrl:text("source_url").notNull(), sourceCheckedAt:text("source_checked_at").notNull(), imageJson:text("image_json"),
  confidence:real("confidence").notNull(), status:text("status",{enum:["draft","review","published","expired","rejected"]}).notNull().default("review"),
  firstSeenAt:text("first_seen_at").notNull(), lastSeenAt:text("last_seen_at").notNull(), publishedAt:text("published_at"), expiresAt:text("expires_at"),
},table=>[
  uniqueIndex("missions_source_external_unique").on(table.sourceId,table.externalId),
  index("missions_status_category_idx").on(table.status,table.category),
  index("missions_neighborhood_status_idx").on(table.neighborhood,table.status),
  index("missions_last_seen_idx").on(table.lastSeenAt),
]);

export const missionSchedules = sqliteTable("mission_schedules",{
  id:integer("id").primaryKey({autoIncrement:true}), missionId:text("mission_id").notNull().references(()=>missions.id,{onDelete:"cascade"}),
  kind:text("kind").notNull(), startsAt:text("starts_at"), endsAt:text("ends_at"), recurrenceRule:text("recurrence_rule"), timezone:text("timezone").notNull().default("America/Los_Angeles"),
},table=>[index("mission_schedules_window_idx").on(table.startsAt,table.endsAt),index("mission_schedules_mission_idx").on(table.missionId)]);

export const ingestionRuns = sqliteTable("ingestion_runs",{
  id:text("id").primaryKey(), sourceId:text("source_id").notNull().references(()=>sources.id), status:text("status").notNull(),
  fetched:integer("fetched").notNull().default(0), normalized:integer("normalized").notNull().default(0), queuedForReview:integer("queued_for_review").notNull().default(0),
  startedAt:text("started_at").notNull(), finishedAt:text("finished_at"), error:text("error"),
},table=>[index("ingestion_runs_source_started_idx").on(table.sourceId,table.startedAt)]);

export const reviewQueue = sqliteTable("review_queue",{
  id:integer("id").primaryKey({autoIncrement:true}), missionId:text("mission_id").notNull().references(()=>missions.id,{onDelete:"cascade"}),
  reasonsJson:text("reasons_json").notNull(), state:text("state",{enum:["open","approved","rejected"]}).notNull().default("open"),
  createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), reviewedAt:text("reviewed_at"), reviewerNote:text("reviewer_note"),
},table=>[index("review_queue_state_created_idx").on(table.state,table.createdAt)]);

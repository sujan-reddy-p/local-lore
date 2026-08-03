CREATE TABLE "candidate_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"run_id" text,
	"external_id" text,
	"decision" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"candidate" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"status" text NOT NULL,
	"fetched" integer DEFAULT 0 NOT NULL,
	"unchanged" integer DEFAULT 0 NOT NULL,
	"normalized" integer DEFAULT 0 NOT NULL,
	"published" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "mission_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"run_id" text,
	"actor" text NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text NOT NULL,
	"kicker" text NOT NULL,
	"description" text NOT NULL,
	"why" text NOT NULL,
	"category" text NOT NULL,
	"format" text,
	"neighborhood" text NOT NULL,
	"venue" text NOT NULL,
	"longitude" real NOT NULL,
	"latitude" real NOT NULL,
	"zone_radius_m" integer NOT NULL,
	"time_label" text NOT NULL,
	"time_slot" text NOT NULL,
	"duration_hours" real NOT NULL,
	"price_dollars" real NOT NULL,
	"vibes" jsonb NOT NULL,
	"traits" jsonb NOT NULL,
	"accessibility" text NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_status" text NOT NULL,
	"source_checked_at" text NOT NULL,
	"image" jsonb,
	"schedule" jsonb,
	"confidence" real NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"canonical_url" text NOT NULL,
	"terms_url" text,
	"attribution" text NOT NULL,
	"allows_automated_fetch" integer DEFAULT 0 NOT NULL,
	"allows_image_reuse" integer DEFAULT 0 NOT NULL,
	"refresh_hours" integer DEFAULT 168 NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"last_checked_at" timestamp with time zone,
	"next_check_at" timestamp with time zone,
	"etag" text,
	"last_modified" text,
	"content_hash" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "candidate_decisions" ADD CONSTRAINT "candidate_decisions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_decisions" ADD CONSTRAINT "candidate_decisions_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_revisions" ADD CONSTRAINT "mission_revisions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_revisions" ADD CONSTRAINT "mission_revisions_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_decisions_source_created_idx" ON "candidate_decisions" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "ingestion_runs_source_started_idx" ON "ingestion_runs" USING btree ("source_id","started_at");--> statement-breakpoint
CREATE INDEX "mission_revisions_mission_created_idx" ON "mission_revisions" USING btree ("mission_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "missions_source_external_unique" ON "missions" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "missions_status_category_idx" ON "missions" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "missions_last_seen_idx" ON "missions" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "sources_due_idx" ON "sources" USING btree ("enabled","next_check_at");
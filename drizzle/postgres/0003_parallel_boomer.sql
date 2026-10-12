CREATE TABLE "event_occurrences" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"mission_id" text,
	"external_id" text NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" text NOT NULL,
	"venue" text,
	"address" text,
	"longitude" real,
	"latitude" real,
	"price" real,
	"currency" text,
	"status" text DEFAULT 'candidate' NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"source_observed_at" timestamp with time zone NOT NULL,
	"source_snapshot_hash" text,
	"source_data" jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"candidate_id" text,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"note" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"run_id" text,
	"actor" text NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_decisions" ADD COLUMN "event_id" text;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "pending_review" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "catalog_order" integer;--> statement-breakpoint
ALTER TABLE "source_observations" ADD COLUMN "extracted_events" jsonb;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "review_status" text DEFAULT 'needs_source_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "timezone" text DEFAULT 'America/Los_Angeles' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_candidate_id_candidate_decisions_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_revisions" ADD CONSTRAINT "event_revisions_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_revisions" ADD CONSTRAINT "event_revisions_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_occurrences_source_external_unique" ON "event_occurrences" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_status_start_idx" ON "event_occurrences" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "event_occurrences_source_start_idx" ON "event_occurrences" USING btree ("source_id","starts_at");--> statement-breakpoint
CREATE INDEX "event_reviews_event_reviewed_idx" ON "event_reviews" USING btree ("event_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "event_reviews_candidate_reviewed_idx" ON "event_reviews" USING btree ("candidate_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "event_revisions_event_created_idx" ON "event_revisions" USING btree ("event_id","created_at");--> statement-breakpoint
ALTER TABLE "candidate_decisions" ADD CONSTRAINT "candidate_decisions_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE set null ON UPDATE no action;
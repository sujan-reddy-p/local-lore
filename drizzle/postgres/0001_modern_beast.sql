CREATE TABLE "source_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"run_id" text,
	"status_code" integer,
	"changed" integer DEFAULT 0 NOT NULL,
	"etag" text,
	"last_modified" text,
	"content_hash" text,
	"content_type" text,
	"extracted_event_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_observations_source_checked_idx" ON "source_observations" USING btree ("source_id","checked_at");
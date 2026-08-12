CREATE TABLE "visitors" (
	"ip_address" text PRIMARY KEY NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visit_count" integer DEFAULT 1 NOT NULL,
	"user_agent" text
);

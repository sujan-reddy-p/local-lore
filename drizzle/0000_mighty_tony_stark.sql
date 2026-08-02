CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`status` text NOT NULL,
	`fetched` integer DEFAULT 0 NOT NULL,
	`normalized` integer DEFAULT 0 NOT NULL,
	`queued_for_review` integer DEFAULT 0 NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`error` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ingestion_runs_source_started_idx` ON `ingestion_runs` (`source_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `mission_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` text NOT NULL,
	`kind` text NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`recurrence_rule` text,
	`timezone` text DEFAULT 'America/Los_Angeles' NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mission_schedules_window_idx` ON `mission_schedules` (`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `mission_schedules_mission_idx` ON `mission_schedules` (`mission_id`);--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`kicker` text NOT NULL,
	`description` text NOT NULL,
	`why` text NOT NULL,
	`category` text NOT NULL,
	`format` text NOT NULL,
	`neighborhood` text NOT NULL,
	`venue` text NOT NULL,
	`longitude` real NOT NULL,
	`latitude` real NOT NULL,
	`zone_radius_m` integer NOT NULL,
	`time_label` text NOT NULL,
	`duration_hours` real NOT NULL,
	`price_dollars` real NOT NULL,
	`vibes_json` text NOT NULL,
	`traits_json` text DEFAULT '[]' NOT NULL,
	`accessibility` text NOT NULL,
	`source_url` text NOT NULL,
	`source_checked_at` text NOT NULL,
	`image_json` text,
	`confidence` real NOT NULL,
	`status` text DEFAULT 'review' NOT NULL,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`published_at` text,
	`expires_at` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `missions_source_external_unique` ON `missions` (`source_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `missions_status_category_idx` ON `missions` (`status`,`category`);--> statement-breakpoint
CREATE INDEX `missions_neighborhood_status_idx` ON `missions` (`neighborhood`,`status`);--> statement-breakpoint
CREATE INDEX `missions_last_seen_idx` ON `missions` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `review_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` text NOT NULL,
	`reasons_json` text NOT NULL,
	`state` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text,
	`reviewer_note` text,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_queue_state_created_idx` ON `review_queue` (`state`,`created_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`canonical_url` text NOT NULL,
	`terms_url` text,
	`attribution` text NOT NULL,
	`allows_automated_fetch` integer DEFAULT false NOT NULL,
	`allows_image_reuse` integer DEFAULT false NOT NULL,
	`refresh_minutes` integer DEFAULT 1440 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_key_unique` ON `sources` (`key`);
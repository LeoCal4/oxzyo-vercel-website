CREATE TYPE "public"."content_block_type" AS ENUM('text', 'markdown');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('game_night', 'tournament', 'special', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "bgg_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"games_imported" integer,
	"games_updated" integer,
	"games_total" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bgg_id" integer,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_bgg_id_unique" UNIQUE("bgg_id")
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"content_type" "content_block_type" NOT NULL,
	"content_it" text NOT NULL,
	"content_en" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_blocks_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "designers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "designers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_it" text NOT NULL,
	"title_en" text,
	"description_it" text,
	"description_en" text,
	"event_type" "event_type" NOT NULL,
	"date" date,
	"start_time" time,
	"end_time" time,
	"location_text" text,
	"use_fixed_venue" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_categories" (
	"game_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "game_categories_game_id_category_id_pk" PRIMARY KEY("game_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "game_designers" (
	"game_id" uuid NOT NULL,
	"designer_id" uuid NOT NULL,
	CONSTRAINT "game_designers_game_id_designer_id_pk" PRIMARY KEY("game_id","designer_id")
);
--> statement-breakpoint
CREATE TABLE "game_mechanics" (
	"game_id" uuid NOT NULL,
	"mechanic_id" uuid NOT NULL,
	CONSTRAINT "game_mechanics_game_id_mechanic_id_pk" PRIMARY KEY("game_id","mechanic_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bgg_id" integer,
	"title" text NOT NULL,
	"title_override" text,
	"image_url" text,
	"image_override" text,
	"min_players" integer,
	"max_players" integer,
	"min_playtime" integer,
	"max_playtime" integer,
	"weight" double precision,
	"year_published" integer,
	"bgg_rating" double precision,
	"bgg_synced_at" timestamp,
	"times_played" integer DEFAULT 0 NOT NULL,
	"club_rating" integer,
	"staff_pick" boolean DEFAULT false NOT NULL,
	"lending_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_bgg_id_unique" UNIQUE("bgg_id")
);
--> statement-breakpoint
CREATE TABLE "mechanics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bgg_id" integer,
	CONSTRAINT "mechanics_name_unique" UNIQUE("name"),
	CONSTRAINT "mechanics_bgg_id_unique" UNIQUE("bgg_id")
);
--> statement-breakpoint
CREATE TABLE "recurring_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"is_cancelled" boolean DEFAULT true NOT NULL,
	"title_it_override" text,
	"title_en_override" text,
	"description_it_override" text,
	"description_en_override" text,
	"location_text_override" text,
	"use_fixed_venue_override" boolean,
	"start_time_override" time,
	"end_time_override" time,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_exceptions_rule_id_exception_date_unique" UNIQUE("rule_id","exception_date")
);
--> statement-breakpoint
CREATE TABLE "recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_it" text NOT NULL,
	"title_en" text,
	"description_it" text,
	"description_en" text,
	"event_type" "event_type" NOT NULL,
	"rrule" text NOT NULL,
	"dtstart" date NOT NULL,
	"until" date,
	"start_time" time,
	"end_time" time,
	"location_text" text,
	"use_fixed_venue" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_categories" ADD CONSTRAINT "game_categories_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_categories" ADD CONSTRAINT "game_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_designers" ADD CONSTRAINT "game_designers_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_designers" ADD CONSTRAINT "game_designers_designer_id_designers_id_fk" FOREIGN KEY ("designer_id") REFERENCES "public"."designers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_mechanics" ADD CONSTRAINT "game_mechanics_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_mechanics" ADD CONSTRAINT "game_mechanics_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_exceptions" ADD CONSTRAINT "recurring_exceptions_rule_id_recurring_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."recurring_rules"("id") ON DELETE cascade ON UPDATE no action;
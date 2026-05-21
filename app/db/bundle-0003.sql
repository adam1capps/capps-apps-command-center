-- Capps Apps Command Center - Phase 10 notes_cache table bundle.
-- Mirrors db/migrations/0003_thin_timeslip.sql. Apply once in the Neon SQL Editor.
-- No seed: the cache fills at runtime from the GitHub Contents API.

BEGIN;

CREATE TABLE "notes_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"repo_path" text NOT NULL,
	"content" text,
	"sha" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_cache_app_repo_unique" UNIQUE("app_id","repo_path")
);
ALTER TABLE "notes_cache" ADD CONSTRAINT "notes_cache_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;

COMMIT;

-- Verification
SELECT count(*) AS notes_cache_count FROM notes_cache;  -- expect 0

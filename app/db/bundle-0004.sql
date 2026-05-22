-- Capps Apps Command Center - Phase 11 integration_events table bundle.
-- Mirrors db/migrations/0004_perpetual_king_bedlam.sql. Apply once in the Neon SQL Editor.
-- No seed: rows are written at runtime by the push webhook (and Phase 12 hooks).

BEGIN;

CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"actor" text,
	"repo_path" text,
	"commit_sha" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;

COMMIT;

-- Verification
SELECT count(*) AS integration_events_count FROM integration_events;  -- expect 0

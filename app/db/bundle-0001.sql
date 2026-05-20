-- Capps Apps Command Center - Phase 8 migration bundle.
-- Adds apps.plan (jsonb) + the change_log audit table.
-- Apply once in the Neon SQL Editor (production branch, db neondb). Idempotent.

BEGIN;

ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "plan" jsonb;

CREATE TABLE IF NOT EXISTS "change_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "app_id" uuid NOT NULL REFERENCES "apps" ("id") ON DELETE CASCADE,
  "actor_email" text NOT NULL,
  "field" text NOT NULL,
  "old_value" text,
  "new_value" text,
  "changed_at" timestamp with time zone DEFAULT now() NOT NULL
);

COMMIT;

-- Verify:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'apps' AND column_name = 'plan';        -- expect 1 row
--   SELECT count(*) FROM change_log;                             -- expect 0

CREATE TABLE "change_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"actor_email" text NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "plan" jsonb;--> statement-breakpoint
ALTER TABLE "change_log" ADD CONSTRAINT "change_log_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
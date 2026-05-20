CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"repo_path" text,
	"commit_sha" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_email" text,
	CONSTRAINT "notes_kind_check" CHECK ("notes"."kind" in ('instruction', 'note'))
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
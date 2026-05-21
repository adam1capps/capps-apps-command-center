CREATE TABLE "notes_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"repo_path" text NOT NULL,
	"content" text,
	"sha" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_cache_app_repo_unique" UNIQUE("app_id","repo_path")
);
--> statement-breakpoint
ALTER TABLE "notes_cache" ADD CONSTRAINT "notes_cache_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
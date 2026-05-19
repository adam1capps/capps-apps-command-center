CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"live_url" text,
	"custom_domain" text,
	"github_repo" text,
	"hosting" text,
	"stage" text NOT NULL,
	"visible_on_showcase" boolean DEFAULT false NOT NULL,
	"next_move" text,
	"blockers" text,
	"api_dependencies" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "status_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"url_status" integer,
	"url_response_ms" integer,
	"last_commit_at" timestamp with time zone,
	"last_commit_msg" text,
	"days_since_commit" integer,
	"health_score" text NOT NULL,
	"drift_detected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_snapshots" ADD CONSTRAINT "status_snapshots_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
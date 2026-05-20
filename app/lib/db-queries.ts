import { and, eq, isNotNull, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { apps } from "@/db/schema";
import type { App } from "@/db/schema";

// Public showcase set: visible, not archived, has a live URL.
// Mirrors the prototype filter in ui-showcase.jsx:6-8.
export async function getShowcaseApps(): Promise<App[]> {
  return db
    .select()
    .from(apps)
    .where(
      and(
        eq(apps.visibleOnShowcase, true),
        ne(apps.stage, "archive"),
        isNotNull(apps.liveUrl),
      ),
    );
}

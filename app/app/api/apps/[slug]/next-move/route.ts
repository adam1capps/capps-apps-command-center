import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { apps, changeLog } from "@/db/schema";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

const Body = z.object({ value: z.string().max(2000).nullable() });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Bad Request", { status: 400 });
  const value = parsed.data.value?.trim() || null;

  const { slug } = await params;
  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (!app) return new Response("Not Found", { status: 404 });

  await db
    .update(apps)
    .set({ nextMove: value, updatedAt: new Date() })
    .where(eq(apps.id, app.id));
  await db.insert(changeLog).values({
    appId: app.id,
    actorEmail: actor.email,
    field: "next_move",
    oldValue: app.nextMove,
    newValue: value,
  });

  return new Response(null, { status: 204 });
}

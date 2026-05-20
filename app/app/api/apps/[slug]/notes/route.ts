import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { apps, notes } from "@/db/schema";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;
  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (!app) return new Response("Not Found", { status: 404 });

  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.appId, app.id))
    .orderBy(desc(notes.updatedAt));
  return Response.json(rows);
}

const PostBody = z.object({
  kind: z.enum(["instruction", "note"]),
  title: z.string().max(200),
  body: z.string().max(20000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const actor = await getActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const parsed = PostBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const { slug } = await params;
  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (!app) return new Response("Not Found", { status: 404 });

  const [created] = await db
    .insert(notes)
    .values({
      appId: app.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
      source: "manual",
      createdByEmail: actor.email,
    })
    .returning();
  return Response.json(created, { status: 201 });
}

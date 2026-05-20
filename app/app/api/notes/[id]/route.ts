import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

const Id = z.string().uuid();

const PatchBody = z.object({
  kind: z.enum(["instruction", "note"]).optional(),
  title: z.string().max(200).optional(),
  body: z.string().max(20000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!Id.safeParse(id).success) return new Response("Bad Request", { status: 400 });

  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const [updated] = await db
    .update(notes)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();
  if (!updated) return new Response("Not Found", { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!Id.safeParse(id).success) return new Response("Bad Request", { status: 400 });

  const [deleted] = await db.delete(notes).where(eq(notes.id, id)).returning();
  if (!deleted) return new Response("Not Found", { status: 404 });
  return new Response(null, { status: 204 });
}

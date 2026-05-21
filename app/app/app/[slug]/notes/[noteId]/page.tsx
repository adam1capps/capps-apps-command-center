import { and, desc, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { apps, notes } from "@/db/schema";
import { NotePageClient } from "@/components/notes/NotePageClient";
import type { ClientNote } from "@/components/notes/NoteRow";

export const dynamic = "force-dynamic";

function serialize(n: typeof notes.$inferSelect): ClientNote {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export default async function NoteRoute({
  params,
}: {
  params: Promise<{ slug: string; noteId: string }>;
}) {
  const { slug, noteId } = await params;

  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (!app) notFound();

  const [note] = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!note || note.appId !== app.id) notFound();

  const others = await db
    .select()
    .from(notes)
    .where(and(eq(notes.appId, app.id), ne(notes.id, noteId)))
    .orderBy(desc(notes.updatedAt))
    .limit(10);

  return (
    <NotePageClient
      note={serialize(note)}
      app={{
        slug: app.slug,
        name: app.name,
        category: app.category,
        stage: app.stage,
        liveUrl: app.liveUrl ?? null,
        description: app.description,
      }}
      otherNotes={others.map(serialize)}
    />
  );
}

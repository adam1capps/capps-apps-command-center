import { notFound } from "next/navigation";

import { NotePageClient } from "@/components/notes/NotePageClient";
import { toNoteUI } from "@/components/notes/meta";
import { getAppBySlug, getNotesForApp } from "@/lib/db-queries";

// Reads live data per request; protected by proxy.ts (clerkMiddleware).
export const dynamic = "force-dynamic";

export default async function NotePageRoute({
  params,
}: {
  params: Promise<{ slug: string; noteId: string }>;
}) {
  const { slug, noteId } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const all = await getNotesForApp(app.id);
  const note = all.find((n) => n.id === noteId);
  if (!note) notFound();

  const others = all.filter((n) => n.id !== noteId).map(toNoteUI);

  return <NotePageClient app={app} note={toNoteUI(note)} others={others} />;
}

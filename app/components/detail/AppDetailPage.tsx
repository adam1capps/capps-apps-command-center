"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NotesButton } from "@/components/notes/NotesButton";
import { NotesModal } from "@/components/notes/NotesModal";
import { KIND_META, formatStamp, toNoteUI, type NoteUI } from "@/components/notes/meta";
import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App, Note, StatusSnapshot } from "@/db/schema";
import type { Issue } from "@/lib/derive";
import type { AppIntel } from "@/lib/intel";
import type { IntegrationData } from "@/lib/cappshub";

import { IntegrationCard } from "./IntegrationCard";

import {
  Card,
  IssuesBanner,
  Row,
  labelMonoSm,
  pillBtnStyle,
  launchBtnStyle,
} from "./primitives";
import { Hero } from "./Hero";
import { QuickStatStrip } from "./QuickStatStrip";
import { NextMoveCard } from "./NextMoveCard";
import { PlanCard } from "./PlanCard";
import { ActivityFeed } from "./panels/ActivityFeed";
import { RepositoryPanel } from "./panels/RepositoryPanel";
import { DatabasePanel } from "./panels/DatabasePanel";
import { HostingPanel } from "./panels/HostingPanel";
import { ApiUsagePanel } from "./panels/ApiUsagePanel";
import { TrafficPanel } from "./panels/TrafficPanel";

// Ported from prototype/ui-detail.jsx:8-260. Repository/DB/Hosting/API/Traffic
// panels land in PR 7C.
export function AppDetailPage({
  app,
  snapshot,
  issues,
  intel,
  notes: initialNotes,
  integration,
}: {
  app: App;
  snapshot: StatusSnapshot | null;
  issues: Issue[];
  intel: AppIntel;
  notes: NoteUI[];
  integration: IntegrationData;
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const router = useRouter();

  const [notes, setNotes] = useState<NoteUI[]>(initialNotes);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !notesOpen) router.push("/dashboard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, notesOpen]);

  const createNote = async (draft: { kind: NoteUI["kind"]; title: string; body: string }) => {
    const res = await fetch(`/api/apps/${app.slug}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error(String(res.status));
    const created = toNoteUI((await res.json()) as Note);
    setNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateNote = async (
    id: string,
    draft: { kind: NoteUI["kind"]; title: string; body: string },
  ) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error(String(res.status));
    const updated = toNoteUI((await res.json()) as Note);
    setNotes((prev) =>
      [updated, ...prev.filter((n) => n.id !== id)].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
  };

  const deleteNote = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(String(res.status));
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: CC.SURFACE_2, animation: "ccFade .14s ease-out" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 30,
          borderBottom: `1px solid ${CC.HAIR}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link href="/dashboard" style={{ ...pillBtnStyle, background: "transparent" }}>
            ← Command Center
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11.5,
              color: CC.MUTED,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.accent }} />
            <span>{CATEGORIES[app.category as Category]?.label ?? app.category}</span>
            <span>/</span>
            <span style={{ color: CC.INK, fontWeight: 700 }}>{app.name}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <NotesButton count={notes.length} onOpen={() => setNotesOpen(true)} />
            {app.githubRepo && (
              <a
                href={`https://github.com/${app.githubRepo}`}
                target="_blank"
                rel="noopener"
                style={pillBtnStyle}
              >
                Repo ↗
              </a>
            )}
            {app.liveUrl ? (
              <a href={app.liveUrl} target="_blank" rel="noopener" style={launchBtnStyle(cat.accent)}>
                Launch
                <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 13 }}>
                  ↗
                </span>
              </a>
            ) : (
              <span
                style={{
                  ...launchBtnStyle(cat.accent),
                  opacity: 0.45,
                  cursor: "not-allowed",
                  background: CC.MUTED_2,
                  color: "#fff",
                }}
              >
                No live URL
              </span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 80px" }}>
        <Hero app={app} snapshot={snapshot} />

        {issues.length > 0 && <IssuesBanner issues={issues} />}

        <QuickStatStrip app={app} snapshot={snapshot} intel={intel} />

        <Row>
          <NextMoveCard app={app} />
          <PlanCard
            slug={app.slug}
            category={app.category}
            plan={integration.planItems ?? app.plan ?? intel.plan}
            synced={!!integration.planItems}
          />
        </Row>

        <div style={{ marginBottom: 18 }}>
          <Card
            title="Notes & instructions"
            right={
              <button
                onClick={() => setNotesOpen(true)}
                style={{
                  background: "transparent",
                  border: `1px solid ${CC.HAIR}`,
                  color: CC.INK,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {notes.length ? "Manage" : "Add"}
              </button>
            }
          >
            {notes.length === 0 ? (
              <div style={{ fontSize: 13, color: CC.MUTED_2, fontStyle: "italic", padding: "4px 0" }}>
                No notes or instructions yet for this app.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notes.slice(0, 4).map((n) => {
                  const meta = KIND_META[n.kind] ?? KIND_META.note;
                  return (
                    <Link
                      key={n.id}
                      href={`/app/${app.slug}/notes/${n.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 4px",
                        borderBottom: `1px solid ${CC.HAIR_2}`,
                        textDecoration: "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-space-mono), monospace",
                          fontSize: 9,
                          fontWeight: 700,
                          color: meta.color,
                          background: meta.tint,
                          padding: "2px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                          flex: "none",
                        }}
                      >
                        {meta.label}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: CC.INK,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-space-mono), monospace",
                          fontSize: 10,
                          color: CC.MUTED_2,
                          flex: "none",
                        }}
                      >
                        {formatStamp(n.updatedAt || n.createdAt)}
                      </span>
                    </Link>
                  );
                })}
                {notes.length > 4 && (
                  <button
                    onClick={() => setNotesOpen(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: CC.MUTED,
                      fontFamily: "var(--font-space-mono), monospace",
                      fontSize: 10.5,
                      cursor: "pointer",
                      padding: "8px 4px 0",
                      textAlign: "left",
                    }}
                  >
                    + {notes.length - 4} more
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div style={{ marginBottom: 18 }}>
          <Card title="Claude Code · .cappshub/">
            <IntegrationCard integration={integration} />
          </Card>
        </div>

        <Row>
          <Card title="Activity">
            <ActivityFeed snapshot={snapshot} intel={intel} />
          </Card>
          <Card
            title="Repository"
            right={
              app.githubRepo ? (
                <span
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 10.5,
                    color: CC.MUTED,
                  }}
                >
                  github.com/{app.githubRepo}
                </span>
              ) : undefined
            }
          >
            <RepositoryPanel intel={intel} githubRepo={app.githubRepo} />
          </Card>
        </Row>

        <Row>
          <Card
            title="Database"
            right={
              intel.database ? (
                <span style={labelMonoSm()}>NEON · {intel.database.region}</span>
              ) : undefined
            }
          >
            <DatabasePanel db={intel.database} />
          </Card>
          <Card
            title="Hosting"
            right={
              intel.hosting ? (
                <span style={labelMonoSm()}>{intel.hosting.provider.toUpperCase()}</span>
              ) : undefined
            }
          >
            <HostingPanel hosting={intel.hosting} deploys={intel.deploys} />
          </Card>
        </Row>

        <Row>
          <Card title="API usage · 24h">
            <ApiUsagePanel rows={intel.apiUsage} />
          </Card>
          <Card title="Traffic · 7d">
            <TrafficPanel traffic={intel.traffic} accent={cat.accent} />
          </Card>
        </Row>
      </div>

      {notesOpen && (
        <NotesModal
          app={app}
          notes={notes}
          onClose={() => setNotesOpen(false)}
          onCreate={createNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onOpenFull={(noteId) => router.push(`/app/${app.slug}/notes/${noteId}`)}
        />
      )}
    </div>
  );
}

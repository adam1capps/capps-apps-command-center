"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App, StatusSnapshot } from "@/db/schema";
import type { Issue } from "@/lib/derive";
import type { AppIntel } from "@/lib/intel";
import type { ClientNote } from "@/components/notes/NoteRow";

import { NotesButton } from "@/components/notes/NotesButton";
import { NotesModal } from "@/components/notes/NotesModal";
import { KIND_META } from "@/components/notes/NoteEditor";
import type { NoteKind } from "@/components/notes/NoteEditor";
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

// Ported from prototype/ui-detail.jsx:8-260. Notes wired in Phase 9B.
export function AppDetailPage({
  app,
  snapshot,
  issues,
  intel,
  notesCount = 0,
  recentNotes = [],
}: {
  app: App;
  snapshot: StatusSnapshot | null;
  issues: Issue[];
  intel: AppIntel;
  notesCount?: number;
  recentNotes?: ClientNote[];
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const router = useRouter();
  const [showNotes, setShowNotes] = useState(false);
  const [localNotesCount, setLocalNotesCount] = useState(notesCount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/dashboard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

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
            <NotesButton count={localNotesCount} onOpen={() => setShowNotes(true)} />
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

        <QuickStatStrip app={app} snapshot={snapshot} intel={intel} notesCount={localNotesCount} />

        <Row>
          <NextMoveCard app={app} />
          <PlanCard slug={app.slug} category={app.category} plan={app.plan ?? intel.plan} />
        </Row>

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

        <Card
          title="Notes & instructions"
          right={
            <NotesButton
              count={localNotesCount}
              onOpen={() => setShowNotes(true)}
            />
          }
        >
          {recentNotes.length === 0 ? (
            <div style={{ color: CC.MUTED_2, fontSize: 13, padding: "8px 0" }}>
              No notes yet.{" "}
              <button
                onClick={() => setShowNotes(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: cat.primary,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Add one
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentNotes.map((n) => {
                const m = KIND_META[n.kind as NoteKind] ?? KIND_META.note;
                return (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "8px 0",
                      borderBottom: `1px solid ${CC.HAIR}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-space-mono), monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        color: m.color,
                        background: m.tint,
                        padding: "2px 5px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        flex: "none",
                        marginTop: 2,
                      }}
                    >
                      {m.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: CC.INK,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </div>
                      {n.body && (
                        <div
                          style={{
                            fontSize: 12,
                            color: CC.MUTED,
                            marginTop: 2,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {n.body}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {localNotesCount > recentNotes.length && (
                <button
                  onClick={() => setShowNotes(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: cat.primary,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "4px 0 0",
                    textAlign: "left",
                  }}
                >
                  View all {localNotesCount} notes ↗
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      {showNotes && (
        <NotesModal
          app={{ slug: app.slug, name: app.name, category: app.category }}
          onClose={(finalCount) => {
            setShowNotes(false);
            setLocalNotesCount(finalCount);
          }}
        />
      )}
    </div>
  );
}

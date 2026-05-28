"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";

// Copy-to-clipboard block for the drop-in hook JSON. Client component because
// of useState + clipboard API. Body comes pre-stringified from the server so we
// don't re-serialize on every keystroke.
export function HookConfigBlock({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => {
            if (!navigator.clipboard) return;
            void navigator.clipboard.writeText(json).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          style={{
            background: "#fff",
            border: `1px solid ${CC.HAIR}`,
            color: CC.INK,
            padding: "6px 12px",
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied ✓" : "Copy JSON"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          background: "#0F172A",
          color: "#E2E8F0",
          fontFamily: "'Space Mono', monospace",
          fontSize: 11.5,
          lineHeight: 1.55,
          borderRadius: 8,
          overflow: "auto",
          maxHeight: 320,
        }}
      >
        {json}
      </pre>
    </>
  );
}

export function NoteGlyph({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
      <path
        d="M2.5 1.5h5L9.5 3.5V10a.5.5 0 0 1-.5.5H2.5A.5.5 0 0 1 2 10V2a.5.5 0 0 1 .5-.5Z"
        stroke={color || "currentColor"}
        strokeWidth="1"
      />
      <path d="M7 1.5V3.5h2.5" stroke={color || "currentColor"} strokeWidth="1" />
      <path
        d="M4 6h4M4 8h3"
        stroke={color || "currentColor"}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ExpandGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path
        d="M7.5 1.5h3v3M10.5 1.5L7 5M4.5 10.5h-3v-3M1.5 10.5L5 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

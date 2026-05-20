import { CC } from "@/lib/tokens";

// CC monogram. Ported from prototype/app.jsx:263-282.
export function Mark({ dark = false }: { dark?: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: dark ? "#fff" : CC.NAVY,
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: "-0.02em",
          color: dark ? CC.NAVY : "#fff",
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}
      >
        CC
      </span>
      <span
        style={{
          position: "absolute",
          right: 4,
          bottom: 4,
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#00BD70",
        }}
      />
    </div>
  );
}

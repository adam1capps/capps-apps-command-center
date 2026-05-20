// Display helpers ported from prototype/ui-shared.jsx:61-66.

export function shortHost(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Coarse "Nd/mo/y ago" for commit recency. Ported from ui-shared.jsx:51-60.
export function relDate(
  iso: string | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (!iso) return "no commits";
  const then = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const d = Math.floor((now - then) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// Fine-grained "just now / Nm / Nh / Nd ago" for the poll timestamp. Computed
// server-side and passed down as a string to avoid hydration drift.
export function relTimeShort(
  iso: string | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (!iso) return "never";
  const then = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

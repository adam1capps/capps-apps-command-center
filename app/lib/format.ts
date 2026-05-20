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

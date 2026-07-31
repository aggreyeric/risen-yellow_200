import { STROOPS_PER_XLM } from "./config";

/** Stroops (i128) -> whole XLM string with thousands separators. */
export function stroopsToXlm(stroops: number): string {
  const xlm = stroops / STROOPS_PER_XLM;
  return xlm.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function xlmToStroops(xlm: number): number {
  return Math.round(xlm * STROOPS_PER_XLM);
}

export function shortAddr(addr: string, head = 6, tail = 6): string {
  if (!addr) return "";
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.min(100, (n / d) * 100);
}

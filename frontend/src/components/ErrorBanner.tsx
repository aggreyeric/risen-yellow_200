import { useEffect } from "react";
import type { AppError } from "../lib/types";
import { XIcon } from "./icons";

const STYLES: Record<
  AppError["type"],
  { ring: string; dot: string; label: string }
> = {
  wallet_not_found: {
    ring: "border-amber-500/40 bg-amber-500/10",
    dot: "bg-amber-400",
    label: "Wallet not found",
  },
  connection_rejected: {
    ring: "border-rose-500/40 bg-rose-500/10",
    dot: "bg-rose-400",
    label: "Connection rejected",
  },
  insufficient_balance: {
    ring: "border-orange-500/40 bg-orange-500/10",
    dot: "bg-orange-400",
    label: "Insufficient balance",
  },
  network: {
    ring: "border-sky-500/40 bg-sky-500/10",
    dot: "bg-sky-400",
    label: "Network error",
  },
  contract: {
    ring: "border-fuchsia-500/40 bg-fuchsia-500/10",
    dot: "bg-fuchsia-400",
    label: "Contract error",
  },
  unknown: {
    ring: "border-zinc-500/40 bg-zinc-500/10",
    dot: "bg-zinc-400",
    label: "Error",
  },
};

export function ErrorBanner({
  error,
  onDismiss,
  autoDismissMs = 9000,
}: {
  error: AppError | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}) {
  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [error, onDismiss, autoDismissMs]);

  if (!error) return null;
  const s = STYLES[error.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto fixed left-1/2 top-4 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border ${s.ring} px-4 py-3 shadow-2xl backdrop-blur-md`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">
            {error.title}{" "}
            <span className="ml-1 rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400">
              {s.label}
            </span>
          </p>
          <p className="mt-0.5 text-sm leading-snug text-zinc-300">
            {error.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="Dismiss"
        >
          <XIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

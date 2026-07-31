import { useState } from "react";
import { BoltIcon } from "./icons";

const QUICK = [10, 25, 100, 250];

export function DonateForm({
  canDonate,
  balanceLabel,
  busy,
  onDonate,
}: {
  canDonate: boolean;
  balanceLabel: string;
  busy: boolean;
  onDonate: (amountXlm: number) => void;
}) {
  const [amount, setAmount] = useState("25");
  const value = parseFloat(amount);
  const valid = Number.isFinite(value) && value > 0;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Make a donation
        </h3>
        <span className="text-xs text-zinc-500">{balanceLabel}</span>
      </div>

      <div className="mt-4 flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-4 pr-14 text-lg font-bold text-zinc-50 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/30"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
            XLM
          </span>
        </div>
        <button
          onClick={() => valid && onDonate(value)}
          disabled={!canDonate || !valid || busy}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-bold text-white shadow-lg shadow-brand-900/30 transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <BoltIcon width={16} height={16} />
          {busy ? "Processing…" : "Donate"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-brand-500/50 hover:text-brand-200"
          >
            {q} XLM
          </button>
        ))}
      </div>

      {!canDonate && (
        <p className="mt-3 text-xs text-zinc-500">
          Switch to <span className="font-semibold text-zinc-300">Live</span> mode
          and connect a funded testnet wallet to donate on-chain. In Demo mode
          donations are simulated.
        </p>
      )}
    </div>
  );
}

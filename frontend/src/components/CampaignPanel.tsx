import type { CampaignState } from "../lib/types";
import { stroopsToXlm, pct } from "../lib/format";
import { FlameIcon, UsersIcon, TargetIcon, LiveDot } from "./icons";

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-base font-bold text-zinc-50">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">
          {label}
        </div>
      </div>
    </div>
  );
}

export function CampaignPanel({
  state,
  lastUpdated,
  loading,
}: {
  state: CampaignState;
  lastUpdated: number;
  loading: boolean;
}) {
  const raised = state.totalRaised;
  const goal = state.goal || 1;
  const percent = pct(raised, goal);

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            <FlameIcon width={12} height={12} /> Active Campaign
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-50 sm:text-3xl">
            Open-source Stellar tooling fund
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-zinc-400">
            Help fund the next wave of Soroban developer tools. Every donation
            is recorded on-chain and forwarded to the cause instantly.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <LiveDot />
          {loading ? "Syncing…" : "Live on-chain"}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-7">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-50 sm:text-4xl">
              {stroopsToXlm(raised)}
            </span>
            <span className="text-lg font-semibold text-zinc-500">XLM</span>
          </div>
          <span className="text-sm font-semibold text-brand-300">
            {percent.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-amber-400 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(percent, 2)}%` }}
          >
            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>raised of {stroopsToXlm(goal)} XLM goal</span>
          <span>
            updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={<TargetIcon width={18} height={18} />}
          label="Goal"
          value={`${stroopsToXlm(goal)} XLM`}
          accent="bg-amber-500/15 text-amber-300"
        />
        <Stat
          icon={<FlameIcon width={18} height={18} />}
          label="Total Raised"
          value={`${stroopsToXlm(raised)} XLM`}
          accent="bg-brand-500/15 text-brand-300"
        />
        <Stat
          icon={<UsersIcon width={18} height={18} />}
          label="Donors"
          value={state.donorCount.toLocaleString()}
          accent="bg-emerald-500/15 text-emerald-300"
        />
      </div>
    </section>
  );
}

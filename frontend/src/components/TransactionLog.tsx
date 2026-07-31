import type { TxRecord } from "../lib/types";
import { explorerTx } from "../lib/config";
import { stroopsToXlm } from "../lib/format";
import {
  CheckIcon,
  XIcon,
  Spinner,
  ExternalIcon,
  BoltIcon,
} from "./icons";

const META: Record<
  TxRecord["status"],
  { label: string; dot: string; text: string }
> = {
  idle: { label: "Idle", dot: "bg-zinc-500", text: "text-zinc-400" },
  preparing: { label: "Preparing", dot: "bg-sky-400", text: "text-sky-300" },
  signing: { label: "Awaiting signature", dot: "bg-amber-400", text: "text-amber-300" },
  submitting: { label: "Submitting", dot: "bg-indigo-400", text: "text-indigo-300" },
  pending: { label: "Pending", dot: "bg-amber-400", text: "text-amber-300" },
  success: { label: "Confirmed", dot: "bg-emerald-400", text: "text-emerald-300" },
  failed: { label: "Failed", dot: "bg-rose-400", text: "text-rose-300" },
};

function Row({ tx }: { tx: TxRecord }) {
  const m = META[tx.status];
  const busy = ["preparing", "signing", "submitting", "pending"].includes(
    tx.status
  );
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.dot}/15 ${m.text}`}>
        {busy ? (
          <Spinner width={14} height={14} />
        ) : tx.status === "success" ? (
          <CheckIcon width={14} height={14} />
        ) : tx.status === "failed" ? (
          <XIcon width={14} height={14} />
        ) : (
          <BoltIcon width={14} height={14} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-200">
            {tx.label}
          </span>
          <span className={`text-[11px] font-semibold ${m.text}`}>
            {m.label}
          </span>
        </div>
        <div className="truncate text-[11px] text-zinc-500">
          {tx.error
            ? tx.error
            : tx.hash
            ? tx.hash.slice(0, 12) + "…"
            : "building transaction…"}
        </div>
      </div>
      {tx.hash && (
        <a
          href={explorerTx(tx.hash)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-brand-300"
          title="View on stellar.expert"
        >
          <ExternalIcon width={14} height={14} />
        </a>
      )}
    </li>
  );
}

export function TransactionLog({
  txs,
  onClear,
}: {
  txs: TxRecord[];
  onClear: () => void;
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Transaction status
        </h3>
        {txs.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {txs.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <BoltIcon width={22} height={22} className="text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">
            Your transactions will appear here
          </p>
          <p className="text-xs text-zinc-600">
            pending → confirmed in real time
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {txs.map((tx) => (
            <Row key={tx.id} tx={tx} />
          ))}
        </ul>
      )}

      {txs.some((t) => t.amount) && (
        <p className="mt-3 text-right text-xs text-zinc-600">
          total this session:{" "}
          <span className="font-semibold text-zinc-400">
            {stroopsToXlm(
              txs
                .filter((t) => t.status === "success")
                .reduce((a, t) => a + (t.amount ?? 0), 0)
            )}{" "}
            XLM
          </span>
        </p>
      )}
    </div>
  );
}

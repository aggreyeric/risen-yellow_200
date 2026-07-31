import type { ConnectedWallet } from "../lib/types";
import { explorerAccount } from "../lib/config";
import { shortAddr } from "../lib/format";
import { WalletIcon, ExternalIcon, LiveDot } from "./icons";

export function Header({
  wallet,
  connecting,
  demoMode,
  onToggleMode,
  onConnect,
  onDisconnect,
}: {
  wallet: ConnectedWallet | null;
  connecting: boolean;
  demoMode: boolean;
  onToggleMode: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40">
          <span className="text-lg font-black text-white">R</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight text-zinc-50">
            Risen
          </h1>
          <p className="text-xs text-zinc-400">Stellar Crowdfunding</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 sm:flex">
          <LiveDot />
          <span>Stellar Testnet</span>
        </div>

        {/* Demo / Live toggle */}
        <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs font-semibold">
          <button
            onClick={() => demoMode || onToggleMode()}
            className={`rounded-full px-3 py-1.5 transition ${
              demoMode
                ? "bg-brand-500 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Demo
          </button>
          <button
            onClick={() => !demoMode || onToggleMode()}
            className={`rounded-full px-3 py-1.5 transition ${
              !demoMode
                ? "bg-emerald-500 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Live
          </button>
        </div>

        {wallet ? (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1">
            <div className="hidden flex-col items-end leading-none sm:flex">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {wallet.walletName}
              </span>
              <a
                href={explorerAccount(wallet.publicKey)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-zinc-200 hover:text-brand-300"
              >
                {shortAddr(wallet.publicKey)}
                <ExternalIcon width={11} height={11} />
              </a>
            </div>
            <button
              onClick={onDisconnect}
              className="rounded-full bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:from-brand-400 hover:to-brand-500 disabled:opacity-60"
          >
            <WalletIcon width={16} height={16} />
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

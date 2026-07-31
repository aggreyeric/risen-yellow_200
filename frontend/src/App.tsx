import { useCallback, useState } from "react";
import { Header } from "./components/Header";
import { CampaignPanel } from "./components/CampaignPanel";
import { DonateForm } from "./components/DonateForm";
import { TransactionLog } from "./components/TransactionLog";
import { ErrorBanner } from "./components/ErrorBanner";
import { useWallet } from "./hooks/useWallet";
import { useCampaign } from "./hooks/useCampaign";
import { donate } from "./lib/contract";
import { demoEngine, simulateTx } from "./lib/demo";
import { STROOPS_PER_XLM } from "./lib/config";
import type { AppError, TxRecord } from "./lib/types";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export default function App() {
  const walletApi = useWallet();
  const campaign = useCampaign(DEMO_MODE);
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);

  const toggleMode = useCallback(() => {
    setDemoMode((prev) => !prev);
  }, []);

  const addTx = useCallback((patch: Partial<TxRecord> & { id: string }) => {
    setTxs((prev) => {
      const idx = prev.findIndex((t) => t.id === patch.id);
      if (idx === -1) {
        const base: TxRecord = {
          id: patch.id,
          hash: undefined,
          status: "preparing",
          label: patch.label ?? "Transaction",
          amount: patch.amount,
          createdAt: Date.now(),
        };
        return [{ ...base, ...patch }, ...prev];
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }, []);

  const handleDonate = useCallback(
    async (amountXlm: number) => {
      setError(null);
      const id = `tx-${Date.now()}`;
      const label = `Donate ${amountXlm} XLM`;
      const amountStroops = Math.round(amountXlm * STROOPS_PER_XLM);

      if (demoMode) {
        await simulateTx(label, amountStroops, (patch: Partial<TxRecord>) =>
          addTx({ id, label, amount: amountStroops, ...patch }),
        );
        demoEngine.addDonation(amountXlm, "you");
        campaign.refresh();
        return;
      }

      if (!walletApi.wallet) {
        setError({
          type: "wallet_not_found",
          title: "Wallet not connected",
          message: "Connect a wallet first to make a donation.",
        });
        return;
      }

      try {
        const result = await donate({
          donorPublicKey: walletApi.wallet.publicKey,
          amountStroops,
          onStatus: (status, patch) =>
            addTx({ id, status, ...(patch ?? {}) }),
        });
        addTx({ id, status: "success", hash: result.hash });
        campaign.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        addTx({ id, status: "failed", error: msg });
        setError({
          type: "contract",
          title: "Transaction failed",
          message: msg,
          raw: e,
        });
      }
    },
    [walletApi, campaign, addTx, demoMode],
  );

  const canDonate = demoMode || !!walletApi.wallet;
  const balanceLabel = demoMode
    ? "Demo mode — simulated balance"
    : walletApi.wallet
      ? `Connected: ${walletApi.wallet.walletName}`
      : "Connect wallet to donate";

  const feed = demoMode ? campaign.demoDonations : campaign.donations;

  return (
    <div className="risen-bg relative min-h-screen overflow-hidden text-zinc-100">
      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-10 sm:px-6">
        <Header
          wallet={walletApi.wallet}
          connecting={walletApi.connecting}
          demoMode={demoMode}
          onToggleMode={toggleMode}
          onConnect={walletApi.connect}
          onDisconnect={walletApi.disconnect}
        />

        <main className="flex flex-1 flex-col gap-5 py-6">
          <CampaignPanel
            state={campaign.state}
            loading={campaign.loading}
            lastUpdated={campaign.lastUpdated}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <DonateForm
              onDonate={handleDonate}
              busy={txs.some(
                (t) =>
                  t.status === "preparing" ||
                  t.status === "signing" ||
                  t.status === "submitting" ||
                  t.status === "pending",
              )}
              canDonate={canDonate}
              balanceLabel={balanceLabel}
            />

            <TransactionLog txs={txs} onClear={() => setTxs([])} />
          </div>

          {feed.length > 0 && (
            <div className="glass rounded-3xl p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Live donation feed
              </h3>
              <ul className="flex flex-col gap-2">
                {feed.slice(0, 6).map((d: any) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                      💜
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-zinc-200">
                        {demoMode ? d.alias : String(d.donor).slice(0, 8) + "…"}
                      </span>
                      <span className="ml-2 text-xs text-zinc-500">donated</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-400">
                      +{(demoMode ? d.amount : d.amount / STROOPS_PER_XLM).toFixed(2)} XLM
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>

        <footer className="border-t border-white/5 py-5 text-center text-xs text-zinc-600">
          <p>
            risen · Stellar Yellow Belt — onchain crowdfunding · Testnet only
          </p>
        </footer>
      </div>
    </div>
  );
}

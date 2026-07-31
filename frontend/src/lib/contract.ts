/**
 * Contract client. Talks to the deployed Soroban crowdfunding contract via the
 * Stellar SDK v16 Soroban RPC.
 *
 * - Reads use `simulateTransaction` over `Contract.call` (no signing, no fees).
 * - Writes (donate) are simulated + prepared, signed by the connected wallet,
 *   submitted, then polled until confirmed.
 * - Real-time events are pulled from `server.getEvents` for the live feed.
 */
import * as StellarSdk from "@stellar/stellar-sdk";

import {
  CONTRACT_ADDRESS,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  SOROBAN_RPC_URL,
} from "./config";
import type { CampaignState, TxStatus } from "./types";
import { signTransactionXdr } from "./wallet";
import { delay } from "./demo";

const server = new StellarSdk.rpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);

/**
 * A funded testnet account used purely as a TransactionBuilder source for
 * read-only simulations (sequence numbers are not consumed by simulate).
 */
const READ_SOURCE_PUBKEY = "GBQYOTSQKR5OBD6PGMKYIU644TZFBC4EKKE4R75YD5LBLXWA3DN6IZRF";

let cachedReadAccount: StellarSdk.Account | null = null;
async function readAccount(): Promise<StellarSdk.Account> {
  if (cachedReadAccount) return cachedReadAccount;
  cachedReadAccount = await server.getAccount(READ_SOURCE_PUBKEY);
  return cachedReadAccount;
}

async function simulate(method: string, ...args: StellarSdk.xdr.ScVal[]) {
  const account = await readAccount();
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
    throw new Error(
      `Simulation failed for ${method}: ${
        StellarSdk.rpc.Api.isSimulationError(sim)
          ? (sim as { error?: string }).error
          : "no return value"
      }`
    );
  }
  return StellarSdk.scValToNative(sim.result.retval);
}

function bigintToNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

/** Read the full campaign snapshot (totals + goal). */
export async function fetchCampaignState(): Promise<CampaignState> {
  const c = (await simulate("get_campaign")) as Record<string, unknown>;
  const goal = bigintToNumber(c.goal);
  return {
    goal,
    totalRaised: bigintToNumber(c.total_raised),
    donorCount: bigintToNumber(c.donor_count),
    initialized: goal > 0,
  };
}

/**
 * Native XLM balance of an account, in XLM (whole units). Used for the
 * "insufficient balance" pre-check before a donation.
 */
export async function getXlmBalance(publicKey: string): Promise<number> {
  const resp = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!resp.ok) {
    if (resp.status === 404) return 0;
    throw new Error(`Could not load account balance (HTTP ${resp.status})`);
  }
  const data = (await resp.json()) as {
    balances?: { asset_type: string; balance: string }[];
  };
  const native = data.balances?.find((b) => b.asset_type === "native");
  return native ? Number(native.balance) : 0;
}

export interface DonationRecord {
  id: string;
  donor: string;
  amount: number;
  totalRaised: number;
  donorCount: number;
  txHash: string;
  ledger: number;
}

/** Recent `Donate` events from the contract (drives the live feed). */
export async function fetchRecentDonations(limit = 10): Promise<DonationRecord[]> {
  const latest = await server.getLatestLedger();
  const start = Math.max(1, latest.sequence - 5000);

  const resp = await server.getEvents({
    startLedger: start,
    filters: [
      {
        type: "contract",
        contractIds: [CONTRACT_ADDRESS],
      },
    ],
    limit,
  });

  const records: DonationRecord[] = [];
  for (const ev of resp.events) {
    try {
      const value = StellarSdk.xdr.ScVal.fromXDR(String(ev.value), "base64");
      const parsed = StellarSdk.scValToNative(value) as Record<string, unknown>;
      if (!parsed || !parsed.donor || parsed.amount === undefined) continue;
      records.push({
        id: ev.id,
        donor: String(parsed.donor),
        amount: bigintToNumber(parsed.amount),
        totalRaised: bigintToNumber(parsed.total_raised),
        donorCount: bigintToNumber(parsed.donor_count),
        txHash: ev.txHash,
        ledger: ev.ledger,
      });
    } catch {
      /* skip non-donation / Initialize events */
    }
  }
  return records;
}

export interface DonateParams {
  donorPublicKey: string;
  amountStroops: number;
  onStatus: (status: TxStatus, patch?: { hash?: string }) => void;
}

/**
 * Submit a real donation: prepare -> sign (wallet) -> submit -> poll -> confirm.
 * `onStatus` streams the lifecycle so the UI can render pending -> success/fail.
 */
export async function donate({
  donorPublicKey,
  amountStroops,
  onStatus,
}: DonateParams): Promise<{ hash: string }> {
  onStatus("preparing");

  const account = await server.getAccount(donorPublicKey);
  const donorAddress = StellarSdk.Address.fromString(donorPublicKey);
  const amountScVal = StellarSdk.nativeToScVal(amountStroops, { type: "i128" });

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("donate", donorAddress.toScVal(), amountScVal)
    )
    .setTimeout(180)
    .build();

  // Simulate + attach Soroban resource data.
  const prepared = await server.prepareTransaction(tx);

  onStatus("signing");
  const signedXdr = await signTransactionXdr(prepared.toXDR(), donorPublicKey);
  const signed = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  onStatus("submitting");
  const send = await server.sendTransaction(signed);
  if (send.status === "ERROR") {
    throw new Error(
      "Transaction rejected by the network" +
        (send.errorResult ? `: ${send.errorResult.result()}` : "")
    );
  }
  if (send.status === "TRY_AGAIN_LATER") {
    throw new Error("Network busy (try again later)");
  }

  onStatus("pending", { hash: send.hash });

  // Poll until the transaction finalises.
  for (let i = 0; i < 40; i++) {
    await delay(2000);
    const res = await server.getTransaction(send.hash);
    if (res.status === "SUCCESS") {
      onStatus("success", { hash: send.hash });
      return { hash: send.hash };
    }
    if (res.status === "FAILED") {
      onStatus("failed", { hash: send.hash });
      throw new Error("Transaction failed on-chain");
    }
    // NOT_FOUND -> keep polling
  }

  onStatus("failed", { hash: send.hash });
  throw new Error("Transaction confirmation timed out");
}

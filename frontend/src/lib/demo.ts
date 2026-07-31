/**
 * Demo / mock data layer.
 *
 * Lets the app run end-to-end without a real wallet or funded account, so the
 * UI (and the required screenshots) can be captured in a headless browser. When
 * `DEMO_MODE` is on, all contract reads return simulated state and writes are
 * resolved after a short, realistic delay while the transaction status flows
 * through preparing -> signing -> pending -> success.
 */

import type { CampaignState, TxRecord } from "./types";
import { CAMPAIGN_GOAL_XLM, STROOPS_PER_XLM } from "./config";

export interface DemoDonation {
  id: string;
  donor: string;
  amount: number; // XLM
  alias: string;
  at: number;
}

const ALIASES = [
  "nova.eth",
  "0xStardust",
  "lumenmaxer",
  "orbit.eth",
  "quantum.kitty",
  "solflare",
  "deepblue",
  "moonshot",
  "satoshi_jr",
  "andromeda",
];

const DONORS = [
  "GABCDEF...RISEN01",
  "GABCDEF...RISEN02",
  "GABCDEF...RISEN03",
  "GABCDEF...RISEN04",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

class DemoEngine {
  totalXlm: number;
  donorCount: number;
  feed: DemoDonation[];

  constructor() {
    // Seed a believable, partially-funded campaign so the progress bar looks
    // alive on first paint.
    this.totalXlm = 412.5;
    this.donorCount = 37;
    this.feed = this.seedFeed();
  }

  private seedFeed(): DemoDonation[] {
    const out: DemoDonation[] = [];
    for (let i = 0; i < 6; i++) {
      out.push({
        id: `seed-${i}`,
        donor: DONORS[i % DONORS.length],
        amount: Number(rand(1, 25).toFixed(2)),
        alias: ALIASES[i % ALIASES.length],
        at: Date.now() - i * rand(40_000, 180_000),
      });
    }
    return out;
  }

  state(): CampaignState {
    return {
      goal: CAMPAIGN_GOAL_XLM * STROOPS_PER_XLM,
      totalRaised: Math.round(this.totalXlm * STROOPS_PER_XLM),
      donorCount: this.donorCount,
      initialized: true,
    };
  }

  addDonation(amountXlm: number, alias: string): DemoDonation {
    this.totalXlm += amountXlm;
    this.donorCount += 1;
    const donor = DONORS[Math.floor(Math.random() * DONORS.length)];
    const donation: DemoDonation = {
      id: `don-${Date.now()}`,
      donor,
      amount: Number(amountXlm.toFixed(2)),
      alias,
      at: Date.now(),
    };
    this.feed = [donation, ...this.feed].slice(0, 12);
    return donation;
  }

  /** Occasionally emit a background donation so the feed feels live. */
  maybeAutoDonate(): DemoDonation | null {
    if (Math.random() < 0.45) {
      const amount = Number(rand(0.5, 8).toFixed(2));
      const alias = ALIASES[Math.floor(Math.random() * ALIASES.length)];
      return this.addDonation(amount, alias);
    }
    return null;
  }
}

export const demoEngine = new DemoEngine();

/** Simulates the full prepare -> sign -> submit -> confirm lifecycle. */
export async function simulateTx(
  label: string,
  amount: number | undefined,
  onUpdate: (patch: Partial<TxRecord>) => void,
  rejectAtSigning = false
): Promise<{ hash: string }> {
  await delay(500);
  onUpdate({ status: "preparing" });
  await delay(600);
  onUpdate({ status: "signing" });
  await delay(700);
  if (rejectAtSigning) {
    throw new Error("User rejected the request");
  }
  onUpdate({ status: "submitting" });
  await delay(500);
  onUpdate({ status: "pending", hash: fakeHash() });
  await delay(rand(1600, 2600));
  onUpdate({ status: "success" });
  return { hash: fakeHash() };
}

export function fakeHash(): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 64; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

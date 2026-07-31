/**
 * Multi-wallet integration built on `@creit.tech/stellar-wallets-kit` v2.
 *
 * The kit v2 exposes a single static class (`StellarWalletsKit`) backed by
 * Preact signals. We wrap it here so the rest of the app deals with plain
 * async functions and our own error classification.
 */
import {
  StellarWalletsKit,
  Networks,
  SwkAppDarkTheme,
  type IKitError,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";

import { NETWORK_PASSPHRASE } from "./config";

const WALLET_NAMES: Record<string, string> = {
  freighter: "Freighter",
  albedo: "Albedo",
  xbull: "xBull",
  hana: "Hana",
  lobstr: "LOBSTR",
};

let initialized = false;

/**
 * Idempotently boot the kit with the wallets we want to offer in the connect
 * modal. We deliberately keep unsupported wallets visible (with install hints)
 * so reviewers can see multiple options even in a browser without them.
 */
export function initKit() {
  if (initialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: [
      new FreighterModule(),
      new AlbedoModule(),
      new xBullModule(),
      new HanaModule(),
      new LobstrModule(),
    ],
    network: Networks.TESTNET,
    theme: SwkAppDarkTheme,
    authModal: {
      showInstallLabel: true,
      hideUnsupportedWallets: false,
    },
  });
  initialized = true;
}

export function isKitError(e: unknown): e is IKitError {
  return (
    !!e &&
    typeof e === "object" &&
    "code" in (e as Record<string, unknown>) &&
    "message" in (e as Record<string, unknown>)
  );
}

/**
 * Open the kit's built-in connect modal and resolve once a wallet is connected.
 * Throws (and is caught + classified upstream) if the user closes the modal or
 * the chosen wallet isn't available.
 */
export async function connectWithModal(): Promise<{
  address: string;
  walletId: string;
  walletName: string;
}> {
  initKit();
  const { address } = await StellarWalletsKit.authModal();
  let walletId = "unknown";
  try {
    walletId = StellarWalletsKit.selectedModule.productId;
  } catch {
    /* selectedModule throws if nothing is set yet */
  }
  return {
    address,
    walletId,
    walletName: WALLET_NAMES[walletId] ?? walletId,
  };
}

/** Cached address after a successful connect (or null). */
export async function getCachedAddress(): Promise<string | null> {
  if (!initialized) return null;
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address ?? null;
  } catch {
    return null;
  }
}

/** Ask the connected wallet to sign a prepared transaction XDR. */
export async function signTransactionXdr(
  xdr: string,
  address: string
): Promise<string> {
  initKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  return signedTxXdr;
}

export async function disconnectWallet(): Promise<void> {
  if (!initialized) return;
  await StellarWalletsKit.disconnect();
}

/** Wallet ids we configured, for display in the UI. */
export const SUPPORTED_WALLETS = Object.entries(WALLET_NAMES).map(
  ([id, name]) => ({ id, name })
);

// Shared domain types for the Risen crowdfunding dApp.

/** Funding goal + live counters read straight from the on-chain campaign. */
export interface CampaignState {
  goal: number;
  totalRaised: number;
  donorCount: number;
  /** Whether the contract has been initialized on-chain. */
  initialized: boolean;
}

/** Lifecycle of a single on-chain interaction, surfaced to the UI. */
export type TxStatus =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "pending"
  | "success"
  | "failed";

export interface TxRecord {
  id: string;
  hash?: string;
  status: TxStatus;
  label: string;
  amount?: number;
  createdAt: number;
  error?: string;
}

/** Distinct, user-facing error categories required by the challenge. */
export type AppErrorType =
  | "wallet_not_found"
  | "connection_rejected"
  | "insufficient_balance"
  | "network"
  | "contract"
  | "unknown";

export interface AppError {
  type: AppErrorType;
  title: string;
  message: string;
  /** Original error, if any, for debugging. */
  raw?: unknown;
}

export interface ConnectedWallet {
  /** Wallet module id, e.g. "freighter" / "albedo" / "xbull". */
  walletId: string;
  /** Human friendly wallet name. */
  walletName: string;
  publicKey: string;
}

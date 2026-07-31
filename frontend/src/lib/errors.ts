import type { AppError, AppErrorType } from "./types";

/**
 * Maps low-level wallet / SDK / network errors to the three categories the
 * "Yellow Belt" challenge requires (plus a couple of generic buckets).
 *
 * The heuristics below inspect error messages and SDK error shapes so that any
 * thrown value ends up as one clear, user-facing message.
 */
export function classifyError(raw: unknown): AppError {
  const msg = errorMessage(raw).toLowerCase();

  // 1) Wallet not found / not installed / not connected.
  if (
    msg.includes("not found") ||
    msg.includes("not installed") ||
    msg.includes("no wallet") ||
    msg.includes("is not installed") ||
    msg.includes("is not connected") ||
    msg.includes("not connected") ||
    msg.includes("not available") ||
    msg.includes("freighter is not") ||
    msg.includes("extension") ||
    msg.includes("provider") ||
    msg.includes("unavailable")
  ) {
    return appError(
      "wallet_not_found",
      "Wallet not found",
      "We couldn't reach that wallet in your browser. Make sure the extension is installed, unlocked, and connected, then try again.",
      raw
    );
  }

  // 2) Connection / signature rejected by the user.
  if (
    msg.includes("rejected") ||
    msg.includes("denied") ||
    msg.includes("cancelled") ||
    msg.includes("canceled") ||
    msg.includes("user declined") ||
    msg.includes("aborted") ||
    msg.includes("closed the modal") ||
    msg.includes("dismissed") ||
    msg.includes("rejected the request") ||
    msg.includes("set the wallet first")
  ) {
    return appError(
      "connection_rejected",
      "Connection rejected",
      "The request was rejected or cancelled in your wallet. Approve the prompt to connect or sign, then try again.",
      raw
    );
  }

  // 3) Insufficient balance.
  if (
    msg.includes("insufficient") ||
    msg.includes("underfunded") ||
    msg.includes("balance") ||
    msg.includes("not enough")
  ) {
    return appError(
      "insufficient_balance",
      "Insufficient balance",
      "Your wallet doesn't have enough XLM to cover this donation plus network fees. Fund your testnet account and retry.",
      raw
    );
  }

  if (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch")
  ) {
    return appError(
      "network",
      "Network error",
      "We couldn't reach the Stellar network. Check your connection and try again.",
      raw
    );
  }

  if (msg.includes("contract") || msg.includes("host") || msg.includes("wasm")) {
    return appError(
      "contract",
      "Contract error",
      "The contract rejected this call. Double-check the amount and that the campaign is still active.",
      raw
    );
  }

  return appError(
    "unknown",
    "Something went wrong",
    "An unexpected error occurred. Please try again.",
    raw
  );
}

export function isAppError(value: unknown): value is AppError {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in (value as Record<string, unknown>) &&
    "title" in (value as Record<string, unknown>)
  );
}

export function appError(
  type: AppErrorType,
  title: string,
  message: string,
  raw?: unknown
): AppError {
  return { type, title, message, raw };
}

function errorMessage(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw;
  if (raw instanceof Error) return raw.message;
  // Stellar SDK errors often carry { code, message, response }.
  const maybe = raw as {
    message?: unknown;
    response?: { statusText?: string };
  };
  if (maybe.response?.statusText) return String(maybe.response.statusText);
  if (typeof maybe.message === "string") return maybe.message;
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

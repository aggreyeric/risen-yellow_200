/**
 * App-wide configuration. All chain constants live here so the rest of the app
 * is network-agnostic.
 */

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const NETWORK_NAME = "TESTNET";

// Public Stellar Testnet Soroban RPC.
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org:443";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/**
 * Native XLM (Stellar Asset Contract) address. This is deterministic and the
 * same on every Stellar network. Verified locally with:
 *   `stellar contract id asset --asset native --network testnet`
 */
export const NATIVE_XLM_SAC =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/**
 * Deployed crowdfunding contract address on Stellar TESTNET.
 *
 * Deployed via `stellar contract deploy` (Soroban). Verified live at:
 *   https://stellar.expert/explorer/testnet/contract/CD76QS2APOWHXZ3E24R5GJIYGF2TUWVED36U3SMTQMAPIIH3AYHS2C46
 */
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ??
  "CD76QS2APOWHXZ3E24R5GJIYGF2TUWVED36U3SMTQMAPIIH3AYHS2C46";

/** Campaign funding goal, in whole XLM. 1 XLM = 10,000,000 stroops. */
export const CAMPAIGN_GOAL_XLM = 1000;
export const STROOPS_PER_XLM = 10_000_000;

export const POLL_INTERVAL_MS = 5000;

export const explorerTx = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const explorerContract = (addr: string) =>
  `https://stellar.expert/explorer/testnet/contract/${addr}`;
export const explorerAccount = (addr: string) =>
  `https://stellar.expert/explorer/testnet/account/${addr}`;

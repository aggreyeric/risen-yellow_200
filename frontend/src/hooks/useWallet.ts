import { useCallback, useEffect, useState } from "react";

import {
  connectWithModal,
  disconnectWallet,
  getCachedAddress,
  initKit,
  SUPPORTED_WALLETS,
} from "../lib/wallet";
import type { ConnectedWallet } from "../lib/types";

export interface WalletApi {
  wallet: ConnectedWallet | null;
  connecting: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  supportedWallets: { id: string; name: string }[];
}

export function useWallet(): WalletApi {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    initKit();
    // Try to restore a previously-connected address from the kit's session.
    getCachedAddress().then((address) => {
      if (address) {
        setWallet({
          walletId: "session",
          walletName: "Wallet",
          publicKey: address,
        });
      }
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { address, walletId, walletName } = await connectWithModal();
      setWallet({ publicKey: address, walletId, walletName });
      return address;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setWallet(null);
  }, []);

  return { wallet, connecting, connect, disconnect, supportedWallets: SUPPORTED_WALLETS };
}

import { useCallback, useEffect, useRef, useState } from "react";

import { POLL_INTERVAL_MS } from "../lib/config";
import type { CampaignState } from "../lib/types";
import {
  fetchCampaignState,
  fetchRecentDonations,
  type DonationRecord,
} from "../lib/contract";
import { demoEngine, type DemoDonation } from "../lib/demo";

const INITIAL: CampaignState = {
  goal: 10_000_000_000,
  totalRaised: 0,
  donorCount: 0,
  initialized: false,
};

export interface CampaignApi {
  state: CampaignState;
  donations: DonationRecord[];
  demoDonations: DemoDonation[];
  loading: boolean;
  lastUpdated: number;
  live: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Real-time campaign state. Polls the contract every few seconds and updates
 * totals + the live donation feed. In demo mode it polls the in-memory engine
 * (which occasionally mints background donations to feel alive).
 */
export function useCampaign(demoMode: boolean): CampaignApi {
  const [state, setState] = useState<CampaignState>(INITIAL);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [demoDonations, setDemoDonations] = useState<DemoDonation[]>(
    demoEngine.feed
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (demoMode) {
      demoEngine.maybeAutoDonate();
      setState(demoEngine.state());
      setDemoDonations([...demoEngine.feed]);
      setLastUpdated(Date.now());
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const [s, recent] = await Promise.all([
        fetchCampaignState(),
        fetchRecentDonations(8),
      ]);
      if (!alive.current) return;
      setState(s);
      setDonations(recent);
      setLastUpdated(Date.now());
      setError(null);
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : "Failed to reach the network");
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      alive.current = false;
      window.clearInterval(id);
    };
  }, [refresh]);

  return {
    state,
    donations,
    demoDonations,
    loading,
    lastUpdated,
    live: !demoMode,
    error,
    refresh,
  };
}

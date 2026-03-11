"use client";

import { useEffect, useState } from "react";
import { getCampaigns, type Campaign } from "@/lib/api";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCampaigns() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load campaigns");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns().catch(() => {});
  }, []);

  return { campaigns, setCampaigns, isLoading, error, retry: loadCampaigns };
}

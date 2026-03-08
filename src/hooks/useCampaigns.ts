"use client";

import { useEffect, useState } from "react";
import { getCampaigns, type Campaign } from "@/lib/api";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCampaigns().then((data) => {
      if (mounted) {
        setCampaigns(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { campaigns, setCampaigns, isLoading };
}

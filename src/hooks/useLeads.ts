"use client";

import { useEffect, useState } from "react";
import { getLeads, type Lead } from "@/lib/api";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLeads() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLeads().catch(() => {});
  }, []);

  return { leads, setLeads, isLoading, error, retry: loadLeads };
}

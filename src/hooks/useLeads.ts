"use client";

import { useEffect, useState } from "react";
import { getLeads, type Lead } from "@/lib/api";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getLeads().then((data) => {
      if (mounted) {
        setLeads(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { leads, setLeads, isLoading };
}

import { useCallback, useEffect, useState } from "react";
import type { LeadQueueItem } from "../../shared/contracts";
import { fetchLeads } from "../api/leadsApi";

export function useLeads() {
  const [leads, setLeads] = useState<LeadQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const reload = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQueue() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchLeads(controller.signal);
        setLeads(result);
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setError(caughtError instanceof Error ? caughtError.message : "The research queue could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadQueue();
    return () => controller.abort();
  }, [requestVersion]);

  return { leads, isLoading, error, reload };
}


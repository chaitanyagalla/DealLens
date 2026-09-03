import { useCallback, useEffect, useState } from "react";
import type { LeadDecision, LeadDetailResponse } from "../../shared/contracts";
import {
  ShortlistApiError,
  fetchLead,
  updateAnalystDecision,
} from "../api/leadsApi";

interface LeadLoadError {
  message: string;
  status: number | null;
}

export function useLead(leadId: string | undefined) {
  const [detail, setDetail] = useState<LeadDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LeadLoadError | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const reload = useCallback(() => setRequestVersion((version) => version + 1), []);

  useEffect(() => {
    if (!leadId) {
      setIsLoading(false);
      setLoadError({ message: "No lead was selected.", status: 404 });
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setIsLoading(true);
      setLoadError(null);
      setDetail(null);

      try {
        setDetail(await fetchLead(leadId!, controller.signal));
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setLoadError({
          message: caughtError instanceof Error ? caughtError.message : "The lead could not be loaded.",
          status: caughtError instanceof ShortlistApiError ? caughtError.status : null,
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadDetail();
    return () => controller.abort();
  }, [leadId, requestVersion]);

  const setAnalystDecision = useCallback(async (decision: LeadDecision | null) => {
    if (!leadId) return;

    setIsSavingDecision(true);
    setDecisionError(null);
    try {
      const result = await updateAnalystDecision(leadId, decision);
      setDetail((current) => current
        ? { ...current, analystDecision: result.analystDecision }
        : current);
    } catch (caughtError) {
      setDecisionError(
        caughtError instanceof Error ? caughtError.message : "The analyst decision could not be saved.",
      );
    } finally {
      setIsSavingDecision(false);
    }
  }, [leadId]);

  return {
    detail,
    isLoading,
    loadError,
    decisionError,
    isSavingDecision,
    reload,
    setAnalystDecision,
  };
}

import type {
  ApiErrorResponse,
  LeadDecision,
  LeadDetailResponse,
  LeadQueueItem,
} from "../../shared/contracts";

export class ShortlistApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

export async function fetchLeads(signal?: AbortSignal): Promise<LeadQueueItem[]> {
  return requestJson<LeadQueueItem[]>("/api/leads", { signal });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let apiError: ApiErrorResponse | null = null;
    try {
      apiError = await response.json() as ApiErrorResponse;
    } catch {
      // A readable fallback is safer than exposing an arbitrary response body.
    }

    throw new ShortlistApiError(
      apiError?.error.message ?? "Shortlist could not complete the request.",
      response.status,
      apiError?.error.code ?? "REQUEST_FAILED",
    );
  }

  return response.json() as Promise<T>;
}

export function fetchLead(leadId: string, signal?: AbortSignal): Promise<LeadDetailResponse> {
  return requestJson<LeadDetailResponse>(`/api/leads/${encodeURIComponent(leadId)}`, { signal });
}

export function updateAnalystDecision(
  leadId: string,
  decision: LeadDecision | null,
): Promise<{ leadId: string; analystDecision: LeadDecision | null }> {
  return requestJson(`/api/leads/${encodeURIComponent(leadId)}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
  });
}

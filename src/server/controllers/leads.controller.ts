import type { Request, Response } from "express";
import type {
  ApiErrorResponse,
  LeadDecision,
  LeadDetailResponse,
  LeadQueueItem,
} from "../../shared/contracts.js";
import { LeadRepository } from "../repositories/lead.repository.js";
import { analyzeLead } from "../services/analysis.service.js";

const VALID_DECISIONS = new Set<LeadDecision>(["SHORTLIST", "RESEARCH", "REJECT"]);

function errorResponse(code: string, message: string): ApiErrorResponse {
  return { error: { code, message } };
}

function formatLocation(city: string | null, state: string | null, country: string | null): string {
  return [city, state, country].filter(Boolean).join(", ") || "Location unavailable";
}

export class LeadsController {
  constructor(private readonly repository: LeadRepository) {}

  list = (_request: Request, response: Response<LeadQueueItem[]>) => {
    const queue = this.repository.getAll().map((lead): LeadQueueItem => {
      const analysis = analyzeLead(lead);
      return {
        leadId: lead.leadId,
        company: lead.company,
        industry: lead.industry,
        location: formatLocation(lead.city, lead.state, lead.country),
        initialFitScore: analysis.initialFitScore,
        dataConfidenceScore: analysis.dataConfidenceScore,
        enrichmentPriorityScore: analysis.enrichmentPriorityScore,
        enrichmentPriorityLabel: analysis.enrichmentPriorityLabel,
        recommendedDecision: analysis.recommendedDecision,
        analystDecision: this.repository.getAnalystDecision(lead.leadId),
      };
    });

    response.json(queue);
  };

  getById = (
    request: Request<{ id: string }>,
    response: Response<LeadDetailResponse | ApiErrorResponse>,
  ) => {
    const lead = this.repository.findById(request.params.id);
    if (!lead) {
      response.status(404).json(errorResponse("LEAD_NOT_FOUND", "The requested lead does not exist."));
      return;
    }

    response.json({
      lead,
      analysis: analyzeLead(lead),
      analystDecision: this.repository.getAnalystDecision(lead.leadId),
    });
  };

  updateDecision = (
    request: Request<{ id: string }, unknown, { decision?: unknown }>,
    response: Response,
  ) => {
    const lead = this.repository.findById(request.params.id);
    if (!lead) {
      response.status(404).json(errorResponse("LEAD_NOT_FOUND", "The requested lead does not exist."));
      return;
    }

    const decision = request.body?.decision;
    if (
      decision !== null &&
      (typeof decision !== "string" || !VALID_DECISIONS.has(decision as LeadDecision))
    ) {
      response.status(400).json(
        errorResponse(
          "INVALID_DECISION",
          "Decision must be SHORTLIST, RESEARCH, REJECT, or null.",
        ),
      );
      return;
    }

    const analystDecision = this.repository.setAnalystDecision(
      lead.leadId,
      decision as LeadDecision | null,
    );
    response.json({ leadId: lead.leadId, analystDecision });
  };
}


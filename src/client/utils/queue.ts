import type { LeadDecision, LeadQueueItem } from "../../shared/contracts";

export type DecisionFilter = LeadDecision | "ALL";
export type SortOption = "fit" | "confidence" | "priority" | "company";

export interface QueueOptions {
  decisionFilter: DecisionFilter;
  industryFilter: string;
  minimumFit: number;
  sortBy: SortOption;
}

export function effectiveDecision(lead: LeadQueueItem): LeadDecision {
  return lead.analystDecision ?? lead.recommendedDecision;
}

/** Filters and sorts a copy, leaving the API response order untouched. */
export function filterAndSortLeads(
  leads: LeadQueueItem[],
  options: QueueOptions,
): LeadQueueItem[] {
  const filtered = leads.filter((lead) => {
    const matchesDecision = options.decisionFilter === "ALL" ||
      effectiveDecision(lead) === options.decisionFilter;
    const matchesIndustry = options.industryFilter === "ALL" ||
      lead.industry === options.industryFilter;

    return matchesDecision && matchesIndustry && lead.initialFitScore >= options.minimumFit;
  });

  return [...filtered].sort((left, right) => {
    if (options.sortBy === "company") return left.company.localeCompare(right.company);
    if (options.sortBy === "fit") return right.initialFitScore - left.initialFitScore;
    if (options.sortBy === "confidence") {
      return right.dataConfidenceScore - left.dataConfidenceScore;
    }
    return right.enrichmentPriorityScore - left.enrichmentPriorityScore;
  });
}


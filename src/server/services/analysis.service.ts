import type {
  InvestmentThesis,
  Lead,
  LeadAnalysis,
  LeadDecision,
  NextResearchAction,
  PriorityLabel,
  ScoreComponent,
} from "../../shared/contracts.js";
import { demoInvestmentThesis } from "../config/thesis.js";
import { isValidWebsite } from "../utils/website.js";

const normalize = (value: string) => value.trim().toLocaleLowerCase();
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function isTargetValue(value: string | null, targets: string[]): boolean {
  return Boolean(value && targets.some((target) => normalize(target) === normalize(value)));
}

/** Scores only information available before expensive enrichment. */
export function calculateInitialFit(
  lead: Lead,
  thesis: InvestmentThesis = demoInvestmentThesis,
): { score: number; breakdown: ScoreComponent[] } {
  const industryMatch = isTargetValue(lead.industry, thesis.targetIndustries);
  const countryMatch = isTargetValue(lead.country, thesis.targetCountries);
  const validWebsite = isValidWebsite(lead.website);
  const naicsConfidence = clamp(lead.searchMetadata.naicsConfidence ?? 0, 0, 1);

  const breakdown: ScoreComponent[] = [
    {
      key: "industry",
      label: "Industry match",
      awardedPoints: industryMatch ? 50 : 0,
      maximumPoints: 50,
      explanation: industryMatch
        ? `${lead.industry} is included in the demo thesis.`
        : lead.industry
          ? `${lead.industry} is outside the demo thesis.`
          : "Industry is not available.",
    },
    {
      key: "country",
      label: "Target market",
      awardedPoints: countryMatch ? 25 : 0,
      maximumPoints: 25,
      explanation: countryMatch
        ? `${lead.country} matches the target geography.`
        : lead.country
          ? `${lead.country} is outside the target geography.`
          : "Country is not available.",
    },
    {
      key: "website",
      label: "Website available",
      awardedPoints: validWebsite ? 10 : 0,
      maximumPoints: 10,
      explanation: validWebsite
        ? "A valid company website is available for verification."
        : "No valid HTTP or HTTPS website is available.",
    },
    {
      key: "classification",
      label: "Classification confidence",
      awardedPoints: Math.round(naicsConfidence * 15),
      maximumPoints: 15,
      explanation: lead.searchMetadata.naicsConfidence == null
        ? "NAICS classification confidence is not available."
        : `NAICS confidence is ${Math.round(naicsConfidence * 100)}%.`,
    },
  ];

  return {
    score: breakdown.reduce((total, component) => total + component.awardedPoints, 0),
    breakdown,
  };
}

/** Measures evidence quality independently from business fit. */
export function calculateDataConfidence(lead: Lead): {
  score: number;
  breakdown: ScoreComponent[];
} {
  const revenuePointMap = { high: 30, medium: 18, low: 9 } as const;
  const revenue = lead.enrichment.revenue;
  const revenuePoints = revenue.status === "available" && revenue.confidence
    ? revenuePointMap[revenue.confidence]
    : 0;
  const ownershipKnown = lead.enrichment.ownershipType !== "unknown";
  const validWebsite = isValidWebsite(lead.website);

  const breakdown: ScoreComponent[] = [
    {
      key: "industry",
      label: "Industry known",
      awardedPoints: lead.industry ? 20 : 0,
      maximumPoints: 20,
      explanation: lead.industry ? "Industry is present in the source lead." : "Industry is missing.",
    },
    {
      key: "location",
      label: "Country known",
      awardedPoints: lead.country ? 15 : 0,
      maximumPoints: 15,
      explanation: lead.country ? "Country is present in the source lead." : "Country is missing.",
    },
    {
      key: "website",
      label: "Website verifiable",
      awardedPoints: validWebsite ? 10 : 0,
      maximumPoints: 10,
      explanation: validWebsite
        ? "Website format can be independently checked."
        : "Website is absent or invalid.",
    },
    {
      key: "revenue",
      label: "Revenue evidence",
      awardedPoints: revenuePoints,
      maximumPoints: 30,
      explanation: revenue.status === "available"
        ? `Revenue is available with ${revenue.confidence ?? "unspecified"} confidence.`
        : revenue.status === "failed"
          ? "Revenue enrichment failed and contributes no confidence."
          : "Revenue is not currently available.",
    },
    {
      key: "ownership",
      label: "Ownership known",
      awardedPoints: ownershipKnown ? 25 : 0,
      maximumPoints: 25,
      explanation: ownershipKnown
        ? "Ownership type is available."
        : "Ownership type has not been verified.",
    },
  ];

  return {
    score: breakdown.reduce((total, component) => total + component.awardedPoints, 0),
    breakdown,
  };
}

function needsRevenueResearch(lead: Lead): boolean {
  const revenue = lead.enrichment.revenue;
  return revenue.status !== "available" ||
    revenue.estimatedRevenue == null ||
    revenue.confidence == null ||
    revenue.confidence === "low";
}

/** Lists only missing facts that can materially affect the thesis decision. */
export function findMissingInformation(lead: Lead): string[] {
  const missing: string[] = [];
  const revenue = lead.enrichment.revenue;

  if (revenue.status === "failed") missing.push("Revenue enrichment failed");
  else if (revenue.status !== "available" || revenue.estimatedRevenue == null) {
    missing.push("Revenue estimate");
  } else if (!revenue.confidence || revenue.confidence === "low") {
    missing.push("Reliable revenue estimate");
  }

  if (lead.enrichment.ownershipType === "unknown") missing.push("Ownership type");
  if (!lead.industry) missing.push("Industry");
  if ((lead.searchMetadata.naicsConfidence ?? 0) < 0.6) {
    missing.push("Reliable industry classification");
  }
  if (!lead.country) missing.push("Country");
  if (!isValidWebsite(lead.website)) missing.push("Valid company website");

  return [...new Set(missing)];
}

/** Prioritizes research effort toward attractive leads with critical data gaps. */
export function calculateEnrichmentPriority(lead: Lead, initialFitScore: number): {
  score: number;
  label: PriorityLabel;
  missingCriticalDataScore: number;
} {
  const missingCriticalDataScore =
    (needsRevenueResearch(lead) ? 50 : 0) +
    (lead.enrichment.ownershipType === "unknown" ? 30 : 0) +
    ((lead.searchMetadata.naicsConfidence ?? 0) < 0.6 ? 15 : 0) +
    (!isValidWebsite(lead.website) ? 5 : 0);
  const score = Math.round(initialFitScore * 0.7 + missingCriticalDataScore * 0.3);
  const label: PriorityLabel = score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";

  return { score, label, missingCriticalDataScore };
}

/** Selects the single unresolved fact with the greatest decision value. */
export function chooseNextResearchAction(lead: Lead): NextResearchAction {
  const revenue = lead.enrichment.revenue;

  if (needsRevenueResearch(lead)) {
    return {
      title: revenue.status === "failed" ? "Verify revenue manually" : "Verify estimated revenue",
      rationale: revenue.status === "failed"
        ? "The enrichment service did not return a usable value. A manual check can determine whether the company fits the target size range."
        : "Revenue could materially change whether this company fits the demo acquisition thesis.",
      status: "needed",
    };
  }

  if (lead.enrichment.ownershipType === "unknown") {
    return {
      title: "Confirm ownership structure",
      rationale: "Founder ownership is preferred by the demo thesis and has not been verified.",
      status: "needed",
    };
  }

  if (!lead.industry || (lead.searchMetadata.naicsConfidence ?? 0) < 0.6) {
    return {
      title: "Validate the industry classification",
      rationale: "The current classification is missing or too uncertain to support a confident decision.",
      status: "needed",
    };
  }

  if (!lead.country) {
    return {
      title: "Confirm company location",
      rationale: "Country is required to evaluate the target-market criterion.",
      status: "needed",
    };
  }

  if (!isValidWebsite(lead.website)) {
    return {
      title: "Verify the company identity",
      rationale: "A valid website is needed to confirm the company and review its offering.",
      status: "needed",
    };
  }

  return {
    title: "Complete the human review",
    rationale: "The core thesis inputs are available. Review qualitative risks before accepting the recommendation.",
    status: "complete",
  };
}

function chooseRecommendation(
  lead: Lead,
  initialFitScore: number,
  dataConfidenceScore: number,
  thesis: InvestmentThesis,
): { decision: LeadDecision; reason: string } {
  const knownIndustryMismatch = Boolean(
    lead.industry && !isTargetValue(lead.industry, thesis.targetIndustries),
  );
  const knownCountryMismatch = Boolean(
    lead.country && !isTargetValue(lead.country, thesis.targetCountries),
  );
  const revenue = lead.enrichment.revenue;
  const revenueAmount = revenue.estimatedRevenue;
  const reliableRevenue = revenue.status === "available" &&
    (revenue.confidence === "medium" || revenue.confidence === "high") &&
    revenueAmount != null;
  const revenueOutsideRange = reliableRevenue && revenueAmount != null &&
    (revenueAmount < thesis.revenueMin || revenueAmount > thesis.revenueMax);

  if (knownIndustryMismatch) {
    return { decision: "REJECT", reason: "The known industry is outside the demo acquisition thesis." };
  }
  if (knownCountryMismatch) {
    return { decision: "REJECT", reason: "The known country is outside the target market." };
  }
  if (revenueOutsideRange) {
    return { decision: "REJECT", reason: "Reliable revenue evidence falls outside the target range." };
  }

  const revenueInsideRange = reliableRevenue && revenueAmount != null &&
    revenueAmount >= thesis.revenueMin && revenueAmount <= thesis.revenueMax;
  const preferredOwnership = lead.enrichment.ownershipType === thesis.preferredOwnership;

  if (initialFitScore >= 80 && dataConfidenceScore >= 70 && revenueInsideRange && preferredOwnership) {
    return {
      decision: "SHORTLIST",
      reason: "Fit and confidence are strong, revenue is in range, and preferred ownership is verified.",
    };
  }

  return {
    decision: "RESEARCH",
    reason: "The lead is not reliably disqualified, but at least one decision-critical question remains.",
  };
}

/** Produces the full, deterministic analysis consumed by both API views. */
export function analyzeLead(
  lead: Lead,
  thesis: InvestmentThesis = demoInvestmentThesis,
): LeadAnalysis {
  const initialFit = calculateInitialFit(lead, thesis);
  const confidence = calculateDataConfidence(lead);
  const priority = calculateEnrichmentPriority(lead, initialFit.score);
  const recommendation = chooseRecommendation(lead, initialFit.score, confidence.score, thesis);

  return {
    initialFitScore: initialFit.score,
    dataConfidenceScore: confidence.score,
    enrichmentPriorityScore: priority.score,
    enrichmentPriorityLabel: priority.label,
    initialFitBreakdown: initialFit.breakdown,
    confidenceBreakdown: confidence.breakdown,
    missingInformation: findMissingInformation(lead),
    nextResearchAction: chooseNextResearchAction(lead),
    recommendedDecision: recommendation.decision,
    recommendationReason: recommendation.reason,
  };
}


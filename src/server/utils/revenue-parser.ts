import type { RevenueConfidence, RevenueEnrichment } from "../../shared/contracts.js";

const FAILURE_PATTERN = /error|failed|failure|unavailable|timed?\s*out/i;
const REVENUE_PATTERN = /(?:revenue\s*:\s*)?\$?\s*(\d+(?:\.\d+)?)\s*([mk])\b/i;
const CONFIDENCE_PATTERN = /\b(low|medium|high)\b/i;

/**
 * Converts the observed revenue-enrichment text into safe structured data.
 * Malformed or provider-error values become explicit failure states instead
 * of throwing and interrupting the lead qualification workflow.
 */
export function parseRevenueEstimate(rawValue: string | null | undefined): RevenueEnrichment {
  if (!rawValue?.trim()) {
    return {
      estimatedRevenue: null,
      confidence: null,
      status: "missing",
      rawValue: rawValue ?? null,
    };
  }

  if (FAILURE_PATTERN.test(rawValue)) {
    return {
      estimatedRevenue: null,
      confidence: null,
      status: "failed",
      rawValue,
    };
  }

  const revenueMatch = rawValue.match(REVENUE_PATTERN);
  if (!revenueMatch?.[1] || !revenueMatch[2]) {
    return {
      estimatedRevenue: null,
      confidence: null,
      status: "failed",
      rawValue,
    };
  }

  const amount = Number.parseFloat(revenueMatch[1]);
  const multiplier = revenueMatch[2].toLowerCase() === "m" ? 1_000_000 : 1_000;
  const confidenceMatch = rawValue.match(CONFIDENCE_PATTERN);
  const confidenceValue = confidenceMatch?.[1]?.toLowerCase();
  const confidence = confidenceValue as RevenueConfidence | undefined;

  return {
    estimatedRevenue: Math.round(amount * multiplier),
    confidence: confidence ?? null,
    status: "available",
    rawValue,
  };
}


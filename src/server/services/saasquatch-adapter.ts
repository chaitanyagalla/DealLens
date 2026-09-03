import type {
  Lead,
  OptionalEnrichment,
  SaaSquatchSearchResponseDto,
} from "../../shared/contracts.js";

function createUnrequestedEnrichment(): OptionalEnrichment {
  return {
    revenue: {
      estimatedRevenue: null,
      confidence: null,
      status: "not_requested",
      rawValue: null,
    },
    employeeCount: null,
    ownershipType: "unknown",
    yearFounded: null,
  };
}

/** Maps the observed SaaSquatch response shape into Shortlist's normalized lead model. */
export function adaptSaaSquatchSearchResponse(response: SaaSquatchSearchResponseDto): Lead[] {
  return response.results.map((result) => ({
    leadId: result.lead_id,
    company: result.company,
    website: result.website,
    industry: result.industry,
    city: result.city,
    state: result.state,
    country: result.country,
    searchMetadata: {
      naicsCode: response.naics.code,
      naicsTitle: response.naics.title,
      naicsConfidence: response.naics.confidence,
    },
    enrichment: createUnrequestedEnrichment(),
  }));
}

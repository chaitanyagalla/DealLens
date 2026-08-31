import type { Lead } from "../../shared/contracts.js";

export function createLead(overrides: Partial<Lead> = {}): Lead {
  const base: Lead = {
    leadId: "test-lead",
    company: "Test Vertical Software",
    website: "https://test-company.example",
    industry: "Vertical Software",
    city: "Austin",
    state: "TX",
    country: "USA",
    searchMetadata: {
      naicsCode: "541511",
      naicsTitle: "Custom Computer Programming Services",
      naicsConfidence: 0.8,
    },
    enrichment: {
      revenue: {
        estimatedRevenue: 5_000_000,
        confidence: "high",
        status: "available",
        rawValue: "Estimated Revenue: 5m - high",
      },
      employeeCount: 50,
      ownershipType: "founder_owned",
      yearFounded: 2015,
    },
  };

  return {
    ...base,
    ...overrides,
    searchMetadata: {
      ...base.searchMetadata,
      ...overrides.searchMetadata,
    },
    enrichment: {
      ...base.enrichment,
      ...overrides.enrichment,
      revenue: {
        ...base.enrichment.revenue,
        ...overrides.enrichment?.revenue,
      },
    },
  };
}


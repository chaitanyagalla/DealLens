import { describe, expect, it } from "vitest";
import {
  analyzeLead,
  calculateDataConfidence,
  calculateEnrichmentPriority,
  calculateInitialFit,
  chooseNextResearchAction,
} from "../services/analysis.service.js";
import { createLead } from "./fixtures.js";

describe("initial fit scoring", () => {
  it("adds the four documented score components", () => {
    const result = calculateInitialFit(createLead());

    expect(result.score).toBe(97);
    expect(result.breakdown.map((component) => component.awardedPoints)).toEqual([50, 25, 10, 12]);
  });

  it("clamps classification confidence to the 0-1 range", () => {
    const aboveMaximum = createLead({
      searchMetadata: { naicsCode: null, naicsTitle: null, naicsConfidence: 2 },
    });
    const belowMinimum = createLead({
      searchMetadata: { naicsCode: null, naicsTitle: null, naicsConfidence: -1 },
    });

    expect(calculateInitialFit(aboveMaximum).score).toBe(100);
    expect(calculateInitialFit(belowMinimum).score).toBe(85);
  });

  it("does not award website points for an invalid protocol", () => {
    expect(calculateInitialFit(createLead({ website: "javascript:alert(1)" })).score).toBe(87);
  });
});

describe("data confidence scoring", () => {
  it("awards full confidence for complete high-confidence evidence", () => {
    expect(calculateDataConfidence(createLead()).score).toBe(100);
  });

  it("uses the documented medium revenue weighting", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: 5_000_000,
          confidence: "medium",
          status: "available",
          rawValue: "5m - medium",
        },
        employeeCount: null,
        ownershipType: "founder_owned",
        yearFounded: null,
      },
    });

    expect(calculateDataConfidence(lead).score).toBe(88);
  });

  it("keeps qualification usable when revenue fails and ownership is unknown", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: null,
          confidence: null,
          status: "failed",
          rawValue: "error: provider failed",
        },
        employeeCount: null,
        ownershipType: "unknown",
        yearFounded: null,
      },
    });

    expect(calculateDataConfidence(lead).score).toBe(45);
    expect(analyzeLead(lead).recommendedDecision).toBe("RESEARCH");
  });
});

describe("enrichment priority and next action", () => {
  it("gives a high priority to a high-fit lead with critical gaps", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: null,
          confidence: null,
          status: "missing",
          rawValue: null,
        },
        employeeCount: null,
        ownershipType: "unknown",
        yearFounded: null,
      },
    });
    const fit = calculateInitialFit(lead).score;

    expect(calculateEnrichmentPriority(lead, fit)).toMatchObject({ score: 92, label: "High" });
  });

  it("keeps a zero-fit lead with all gaps in the low priority band", () => {
    const lead = createLead({
      industry: "Freight Services",
      country: "Canada",
      website: null,
      searchMetadata: { naicsCode: null, naicsTitle: null, naicsConfidence: null },
      enrichment: {
        revenue: {
          estimatedRevenue: null,
          confidence: null,
          status: "missing",
          rawValue: null,
        },
        employeeCount: null,
        ownershipType: "unknown",
        yearFounded: null,
      },
    });
    const fit = calculateInitialFit(lead).score;

    expect(fit).toBe(0);
    expect(calculateEnrichmentPriority(lead, fit)).toMatchObject({ score: 30, label: "Low" });
  });

  it("prioritizes failed revenue ahead of unknown ownership", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: null,
          confidence: null,
          status: "failed",
          rawValue: "error: unavailable",
        },
        employeeCount: null,
        ownershipType: "unknown",
        yearFounded: null,
      },
    });

    expect(chooseNextResearchAction(lead).title).toBe("Verify revenue manually");
  });

  it("moves to ownership after reliable revenue is available", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: 5_000_000,
          confidence: "high",
          status: "available",
          rawValue: "5m - high",
        },
        employeeCount: null,
        ownershipType: "unknown",
        yearFounded: null,
      },
    });

    expect(chooseNextResearchAction(lead).title).toBe("Confirm ownership structure");
  });
});

describe("recommendations", () => {
  it("shortlists a strong, well-supported lead", () => {
    expect(analyzeLead(createLead()).recommendedDecision).toBe("SHORTLIST");
  });

  it("researches a high-fit lead with uncertain revenue", () => {
    const lead = createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: 5_000_000,
          confidence: "low",
          status: "available",
          rawValue: "5m - low",
        },
        employeeCount: null,
        ownershipType: "founder_owned",
        yearFounded: null,
      },
    });

    expect(analyzeLead(lead).recommendedDecision).toBe("RESEARCH");
  });

  it.each([
    [createLead({ industry: "Freight Services" }), "industry"],
    [createLead({ country: "Canada" }), "country"],
    [createLead({
      enrichment: {
        revenue: {
          estimatedRevenue: 25_000_000,
          confidence: "high",
          status: "available",
          rawValue: "25m - high",
        },
        employeeCount: null,
        ownershipType: "founder_owned",
        yearFounded: null,
      },
    }), "revenue"],
  ])("rejects a reliable %s mismatch", (lead) => {
    expect(analyzeLead(lead).recommendedDecision).toBe("REJECT");
  });
});


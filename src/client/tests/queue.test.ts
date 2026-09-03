import { describe, expect, it } from "vitest";
import type { LeadQueueItem } from "../../shared/contracts";
import { effectiveDecision, filterAndSortLeads } from "../utils/queue";

const leads: LeadQueueItem[] = [
  {
    leadId: "a",
    company: "AtlasOps",
    industry: "Vertical Software",
    location: "Denver, CO, USA",
    initialFitScore: 98,
    dataConfidenceScore: 70,
    enrichmentPriorityScore: 84,
    enrichmentPriorityLabel: "High",
    recommendedDecision: "RESEARCH",
    analystDecision: null,
  },
  {
    leadId: "n",
    company: "Nimbus",
    industry: "Healthcare Software",
    location: "Austin, TX, USA",
    initialFitScore: 99,
    dataConfidenceScore: 100,
    enrichmentPriorityScore: 69,
    enrichmentPriorityLabel: "Medium",
    recommendedDecision: "SHORTLIST",
    analystDecision: "REJECT",
  },
  {
    leadId: "b",
    company: "BlueOak",
    industry: "Logistics Services",
    location: "Memphis, TN, USA",
    initialFitScore: 49,
    dataConfidenceScore: 100,
    enrichmentPriorityScore: 34,
    enrichmentPriorityLabel: "Low",
    recommendedDecision: "REJECT",
    analystDecision: null,
  },
];

describe("research queue rules", () => {
  it("uses the analyst decision when one exists", () => {
    expect(effectiveDecision(leads[1]!)).toBe("REJECT");
    expect(effectiveDecision(leads[0]!)).toBe("RESEARCH");
  });

  it("combines decision, industry, and minimum-fit filters", () => {
    const result = filterAndSortLeads(leads, {
      decisionFilter: "RESEARCH",
      industryFilter: "Vertical Software",
      minimumFit: 90,
      sortBy: "priority",
    });

    expect(result.map((lead) => lead.leadId)).toEqual(["a"]);
  });

  it("sorts score fields from highest to lowest", () => {
    const result = filterAndSortLeads(leads, {
      decisionFilter: "ALL",
      industryFilter: "ALL",
      minimumFit: 0,
      sortBy: "confidence",
    });

    expect(result.map((lead) => lead.leadId)).toEqual(["n", "b", "a"]);
  });

  it("sorts company names alphabetically without mutating the input", () => {
    const originalOrder = leads.map((lead) => lead.leadId);
    const result = filterAndSortLeads(leads, {
      decisionFilter: "ALL",
      industryFilter: "ALL",
      minimumFit: 0,
      sortBy: "company",
    });

    expect(result.map((lead) => lead.company)).toEqual(["AtlasOps", "BlueOak", "Nimbus"]);
    expect(leads.map((lead) => lead.leadId)).toEqual(originalOrder);
  });
});


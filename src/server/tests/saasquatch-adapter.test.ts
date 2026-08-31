import { describe, expect, it } from "vitest";
import { adaptSaaSquatchSearchResponse } from "../services/saasquatch-adapter.js";

describe("adaptSaaSquatchSearchResponse", () => {
  it("maps snake-case lead data and shared NAICS metadata", () => {
    const [lead] = adaptSaaSquatchSearchResponse({
      count: 1,
      naics: {
        code: "541511",
        title: "Custom Computer Programming Services",
        confidence: 0.8025,
        level: 6,
      },
      results: [
        {
          lead_id: "source-1",
          company: "Example Software",
          website: "https://example.test",
          industry: "Software Development",
          city: "Austin",
          state: "TX",
          country: "USA",
        },
      ],
    });

    expect(lead).toMatchObject({
      leadId: "source-1",
      company: "Example Software",
      searchMetadata: {
        naicsCode: "541511",
        naicsConfidence: 0.8025,
      },
      enrichment: {
        revenue: { status: "not_requested" },
        ownershipType: "unknown",
      },
    });
  });
});


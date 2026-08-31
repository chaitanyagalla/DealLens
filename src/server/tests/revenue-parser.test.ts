import { describe, expect, it } from "vitest";
import { parseRevenueEstimate } from "../utils/revenue-parser.js";

describe("parseRevenueEstimate", () => {
  it.each([
    ["Estimated Revenue: 5m - medium", 5_000_000, "medium"],
    ["$2.5M - high", 2_500_000, "high"],
    ["Estimated Revenue: 750k - low", 750_000, "low"],
  ] as const)("parses %s", (rawValue, expectedAmount, expectedConfidence) => {
    expect(parseRevenueEstimate(rawValue)).toMatchObject({
      estimatedRevenue: expectedAmount,
      confidence: expectedConfidence,
      status: "available",
    });
  });

  it("marks an empty value as missing", () => {
    expect(parseRevenueEstimate(null)).toEqual({
      estimatedRevenue: null,
      confidence: null,
      status: "missing",
      rawValue: null,
    });
  });

  it("converts a provider error into a failed state", () => {
    expect(parseRevenueEstimate("error: All Gemini models failed")).toMatchObject({
      estimatedRevenue: null,
      confidence: null,
      status: "failed",
    });
  });

  it("fails safely when the value is malformed", () => {
    expect(parseRevenueEstimate("Revenue pending review")).toMatchObject({
      estimatedRevenue: null,
      confidence: null,
      status: "failed",
    });
  });
});


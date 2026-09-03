import { describe, expect, it } from "vitest";
import {
  formatConfidence,
  formatEnrichmentStatus,
  formatMoney,
  formatOwnership,
  safeHttpUrl,
} from "../utils/leadDetail";

describe("lead detail formatting", () => {
  it("allows only HTTP and HTTPS website links", () => {
    expect(safeHttpUrl("https://example.com")).toBe("https://example.com/");
    expect(safeHttpUrl("http://example.com/path")).toBe("http://example.com/path");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });

  it("formats revenue without implying precision that is not present", () => {
    expect(formatMoney(2_500_000)).toBe("$2,500,000");
    expect(formatMoney(null)).toBe("Unavailable");
  });

  it("turns ownership values into readable labels", () => {
    expect(formatOwnership("founder_owned")).toBe("Founder-owned");
    expect(formatOwnership("other")).toBe("Other ownership");
    expect(formatOwnership("unknown")).toBe("Unknown");
  });

  it("turns enrichment states into readable labels", () => {
    expect(formatEnrichmentStatus("available")).toBe("Available");
    expect(formatEnrichmentStatus("not_requested")).toBe("Not requested");
    expect(formatEnrichmentStatus("failed")).toBe("Failed");
  });

  it("formats nullable revenue confidence", () => {
    expect(formatConfidence("high")).toBe("High");
    expect(formatConfidence(null)).toBe("Unavailable");
  });
});

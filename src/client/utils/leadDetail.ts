import type {
  EnrichmentStatus,
  OwnershipType,
  RevenueConfidence,
} from "../../shared/contracts";

export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function formatMoney(amount: number | null): string {
  if (amount == null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOwnership(ownership: OwnershipType): string {
  if (ownership === "founder_owned") return "Founder-owned";
  if (ownership === "other") return "Other ownership";
  return "Unknown";
}

export function formatEnrichmentStatus(status: EnrichmentStatus): string {
  if (status === "not_requested") return "Not requested";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatConfidence(confidence: RevenueConfidence | null): string {
  return confidence
    ? confidence.charAt(0).toUpperCase() + confidence.slice(1)
    : "Unavailable";
}


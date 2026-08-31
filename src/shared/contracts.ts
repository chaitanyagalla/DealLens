export type LeadDecision = "SHORTLIST" | "RESEARCH" | "REJECT";
export type EnrichmentStatus = "available" | "missing" | "failed" | "not_requested";
export type RevenueConfidence = "low" | "medium" | "high";
export type OwnershipType = "founder_owned" | "other" | "unknown";
export type PriorityLabel = "Low" | "Medium" | "High";

export interface SaaSquatchLeadDto {
  lead_id: string;
  company: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface SaaSquatchSearchResponseDto {
  count: number;
  naics: {
    code: string | null;
    title: string | null;
    confidence: number | null;
    level?: number | null;
  };
  results: SaaSquatchLeadDto[];
}

export interface SearchMetadata {
  naicsCode: string | null;
  naicsTitle: string | null;
  naicsConfidence: number | null;
}

export interface RevenueEnrichment {
  estimatedRevenue: number | null;
  confidence: RevenueConfidence | null;
  status: EnrichmentStatus;
  rawValue: string | null;
}

export interface OptionalEnrichment {
  revenue: RevenueEnrichment;
  employeeCount: number | null;
  ownershipType: OwnershipType;
  yearFounded: number | null;
}

export interface Lead {
  leadId: string;
  company: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  searchMetadata: SearchMetadata;
  enrichment: OptionalEnrichment;
}

export interface InvestmentThesis {
  name: string;
  targetIndustries: string[];
  targetCountries: string[];
  revenueMin: number;
  revenueMax: number;
  preferredOwnership: "founder_owned";
}

export interface ScoreComponent {
  key: string;
  label: string;
  awardedPoints: number;
  maximumPoints: number;
  explanation: string;
}

export interface NextResearchAction {
  title: string;
  rationale: string;
  status: "needed" | "complete";
}

export interface LeadAnalysis {
  initialFitScore: number;
  dataConfidenceScore: number;
  enrichmentPriorityScore: number;
  enrichmentPriorityLabel: PriorityLabel;
  initialFitBreakdown: ScoreComponent[];
  confidenceBreakdown: ScoreComponent[];
  missingInformation: string[];
  nextResearchAction: NextResearchAction;
  recommendedDecision: LeadDecision;
  recommendationReason: string;
}

export interface LeadQueueItem {
  leadId: string;
  company: string;
  industry: string | null;
  location: string;
  initialFitScore: number;
  dataConfidenceScore: number;
  enrichmentPriorityScore: number;
  enrichmentPriorityLabel: PriorityLabel;
  recommendedDecision: LeadDecision;
  analystDecision: LeadDecision | null;
}

export interface LeadDetailResponse {
  lead: Lead;
  analysis: LeadAnalysis;
  analystDecision: LeadDecision | null;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}


import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Lead, LeadDecision, OwnershipType } from "../../shared/contracts.js";
import { parseRevenueEstimate } from "../utils/revenue-parser.js";

interface DemoLeadRecord {
  leadId: string;
  company: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  naicsCode: string | null;
  naicsTitle: string | null;
  naicsConfidence: number | null;
  rawRevenue: string | null;
  ownershipType: OwnershipType;
  employeeCount: number | null;
  yearFounded: number | null;
}

function loadDemoLeads(): Lead[] {
  const filePath = resolve(process.cwd(), "data", "demo-leads.json");
  const records = JSON.parse(readFileSync(filePath, "utf8")) as DemoLeadRecord[];

  return records.map((record) => ({
    leadId: record.leadId,
    company: record.company,
    website: record.website,
    industry: record.industry,
    city: record.city,
    state: record.state,
    country: record.country,
    searchMetadata: {
      naicsCode: record.naicsCode,
      naicsTitle: record.naicsTitle,
      naicsConfidence: record.naicsConfidence,
    },
    enrichment: {
      revenue: parseRevenueEstimate(record.rawRevenue),
      employeeCount: record.employeeCount,
      ownershipType: record.ownershipType,
      yearFounded: record.yearFounded,
    },
  }));
}

/**
 * Provides a replaceable storage boundary. Demo leads come from JSON, while
 * analyst decisions remain in memory and intentionally reset on restart.
 */
export class LeadRepository {
  private readonly leads: Lead[];
  private readonly analystDecisions = new Map<string, LeadDecision>();

  constructor(leads: Lead[] = loadDemoLeads()) {
    this.leads = structuredClone(leads);
  }

  getAll(): Lead[] {
    return structuredClone(this.leads);
  }

  findById(leadId: string): Lead | undefined {
    const lead = this.leads.find((candidate) => candidate.leadId === leadId);
    return lead ? structuredClone(lead) : undefined;
  }

  getAnalystDecision(leadId: string): LeadDecision | null {
    return this.analystDecisions.get(leadId) ?? null;
  }

  setAnalystDecision(leadId: string, decision: LeadDecision | null): LeadDecision | null {
    if (decision === null) {
      this.analystDecisions.delete(leadId);
      return null;
    }

    this.analystDecisions.set(leadId, decision);
    return decision;
  }
}


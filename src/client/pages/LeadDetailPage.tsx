import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import type { LeadDecision } from "../../shared/contracts";
import { ScoreBreakdown } from "../components/ScoreBreakdown";
import { DecisionBadge, PriorityBadge, formatDecision } from "../components/StatusBadge";
import { useLead } from "../hooks/useLead";
import {
  formatConfidence,
  formatEnrichmentStatus,
  formatMoney,
  formatOwnership,
  safeHttpUrl,
} from "../utils/leadDetail";

const decisions: LeadDecision[] = ["SHORTLIST", "RESEARCH", "REJECT"];

const decisionButtonStyles: Record<LeadDecision, string> = {
  SHORTLIST: "hover:border-mint/60 hover:text-mint aria-pressed:border-mint/50 aria-pressed:bg-mint/10 aria-pressed:text-mint",
  RESEARCH: "hover:border-warn/60 hover:text-warn aria-pressed:border-warn/50 aria-pressed:bg-warn/10 aria-pressed:text-warn",
  REJECT: "hover:border-danger/60 hover:text-danger aria-pressed:border-danger/50 aria-pressed:bg-danger/10 aria-pressed:text-danger",
};

function DetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1280px] animate-pulse px-5 py-9 sm:px-8 lg:px-12 lg:py-12" aria-label="Loading lead details" aria-busy="true">
      <div className="h-4 w-32 rounded bg-white/8" />
      <div className="mt-8 h-11 w-72 rounded bg-white/8" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-white/5" />
      <div className="mt-8 h-40 border-y border-line bg-white/[0.015]" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.65fr)]">
        <div className="h-[42rem] border-t border-line bg-white/[0.01]" />
        <div className="h-[34rem] border-t border-line bg-white/[0.01] lg:border-l lg:border-t-0" />
      </div>
    </main>
  );
}

function DetailError({ message, notFound, onRetry }: { message: string; notFound: boolean; onRetry: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-[1280px] place-items-center px-5 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-danger/30 bg-danger/10 font-mono text-danger">!</span>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-danger">{notFound ? "Lead not found" : "Lead unavailable"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{notFound ? "This lead does not exist." : "We could not load this lead."}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium text-ink no-underline transition hover:border-acid hover:text-acid">Back to queue</Link>
          {!notFound && <button type="button" onClick={onRetry} className="rounded-lg bg-acid px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-acid/90">Try again</button>}
        </div>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="max-w-[62%] text-right text-xs font-medium leading-5 text-ink">{value}</dd>
    </div>
  );
}

function SummaryMetric({
  label,
  score,
  detail,
}: {
  label: string;
  score: number;
  detail: string;
}) {
  return (
    <div className="px-4 py-5 sm:px-5" aria-label={`${label}: ${score} out of 100`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-medium tracking-[-0.04em] text-ink">
        {score}<span className="ml-1 text-[10px] font-normal tracking-normal text-muted">/ 100</span>
      </p>
      <p className="mt-1.5 text-xs leading-4 text-muted">{detail}</p>
    </div>
  );
}

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const {
    detail,
    isLoading,
    loadError,
    decisionError,
    isSavingDecision,
    reload,
    setAnalystDecision,
  } = useLead(leadId);

  useEffect(() => {
    document.title = detail ? `${detail.lead.company} | Shortlist` : "Lead details | Shortlist";
    return () => { document.title = "Shortlist"; };
  }, [detail]);

  if (isLoading) return <DetailSkeleton />;
  if (loadError || !detail) {
    return <DetailError message={loadError?.message ?? "The lead could not be loaded."} notFound={loadError?.status === 404} onRetry={reload} />;
  }

  const { lead, analysis, analystDecision } = detail;
  const websiteUrl = safeHttpUrl(lead.website);
  const location = [lead.city, lead.state, lead.country].filter(Boolean).join(", ") || "Location unavailable";

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted no-underline transition hover:text-ink">
        <span aria-hidden="true">←</span> Back to research queue
      </Link>

      <section className="mt-7 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium text-muted">Lead analysis</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">{lead.company}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{lead.industry ?? "Industry unavailable"} <span aria-hidden="true">·</span> {location}</p>
        </div>
        {websiteUrl ? (
          <a href={websiteUrl} target="_blank" rel="noreferrer noopener" className="inline-flex w-fit items-center gap-2 rounded-md border border-line-strong px-3.5 py-2 text-xs font-medium text-ink no-underline transition hover:border-muted">
            Visit website <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="w-fit rounded-md border border-line px-3.5 py-2 text-xs text-muted">Website unavailable</span>
        )}
      </section>

      <section className="mt-8 border-y border-line" aria-labelledby="recommendation-heading">
        <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="py-6 lg:border-r lg:border-line lg:pr-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="recommendation-heading" className="text-base font-semibold text-ink">Recommendation</h2>
              <DecisionBadge decision={analysis.recommendedDecision} />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{analysis.recommendationReason}</p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-line" aria-label="Lead scores">
            <SummaryMetric label="Initial fit" score={analysis.initialFitScore} detail="Thesis fit" />
            <SummaryMetric label="Confidence" score={analysis.dataConfidenceScore} detail="Data quality" />
            <SummaryMetric label="Priority" score={analysis.enrichmentPriorityScore} detail={analysis.enrichmentPriorityLabel} />
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.65fr)] lg:items-start">
        <section aria-labelledby="evidence-heading">
          <div className="border-b border-line pb-5">
            <h2 id="evidence-heading" className="text-xl font-semibold text-ink">Scoring details</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">How the company was assessed against the thesis and the available source data.</p>
          </div>

          <div className="py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-ink">Initial fit</h3>
                <p className="mt-1 text-xs text-muted">Match against the demo acquisition thesis</p>
              </div>
              <strong className="font-mono text-xl font-medium text-ink">{analysis.initialFitScore}<span className="ml-1 text-[10px] font-normal text-muted">/ 100</span></strong>
            </div>
            <ScoreBreakdown components={analysis.initialFitBreakdown} />
          </div>

          <div className="border-t border-line py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-ink">Data confidence</h3>
                <p className="mt-1 text-xs text-muted">Completeness and reliability of the evidence</p>
              </div>
              <strong className="font-mono text-xl font-medium text-ink">{analysis.dataConfidenceScore}<span className="ml-1 text-[10px] font-normal text-muted">/ 100</span></strong>
            </div>
            <ScoreBreakdown components={analysis.confidenceBreakdown} />
          </div>
        </section>

        <aside className="border-t border-line lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-8" aria-label="Review workspace">
          <section className="border-b border-line py-6 lg:pt-0">
            <p className="text-xs font-medium text-muted">Next step</p>
            <div className="mt-3 border-l-2 border-warn/70 pl-4">
              <h2 className="text-base font-semibold text-ink">{analysis.nextResearchAction.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{analysis.nextResearchAction.rationale}</p>
            </div>
          </section>

          <section className="border-b border-line py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">Human review</p>
                <h2 className="mt-1.5 text-base font-semibold text-ink">Analyst decision</h2>
              </div>
              {analystDecision ? <DecisionBadge decision={analystDecision} /> : <span className="text-xs text-muted">Not reviewed</span>}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">Record your independent decision after reviewing the evidence.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {decisions.map((decision) => (
                <button
                  key={decision}
                  type="button"
                  aria-pressed={analystDecision === decision}
                  disabled={isSavingDecision}
                  onClick={() => void setAnalystDecision(decision)}
                  className={`rounded-md border border-line-strong px-2 py-2 text-xs font-medium text-muted transition disabled:cursor-wait disabled:opacity-50 ${decisionButtonStyles[decision]}`}
                >
                  {formatDecision(decision)}
                </button>
              ))}
            </div>
            {analystDecision && (
              <button type="button" disabled={isSavingDecision} onClick={() => void setAnalystDecision(null)} className="mt-3 text-xs text-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink disabled:cursor-wait disabled:opacity-50">
                Clear decision
              </button>
            )}
            {isSavingDecision && <p className="mt-3 text-xs text-muted" role="status">Saving decision…</p>}
            {decisionError && <p className="mt-3 text-xs leading-5 text-danger" role="alert">{decisionError}</p>}
          </section>

          <section className="border-b border-line py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">Company data</p>
                <h2 className="mt-1.5 text-base font-semibold text-ink">Enrichment</h2>
              </div>
              <PriorityBadge label={analysis.enrichmentPriorityLabel} />
            </div>
            <dl className="mt-4 divide-y divide-line/70 border-y border-line/70">
              <Fact label="Revenue" value={formatMoney(lead.enrichment.revenue.estimatedRevenue)} />
              <Fact label="Revenue status" value={formatEnrichmentStatus(lead.enrichment.revenue.status)} />
              <Fact label="Confidence" value={formatConfidence(lead.enrichment.revenue.confidence)} />
              <Fact label="Ownership" value={formatOwnership(lead.enrichment.ownershipType)} />
              <Fact label="Employees" value={lead.enrichment.employeeCount?.toLocaleString("en-US") ?? "Unavailable"} />
              <Fact label="Founded" value={lead.enrichment.yearFounded?.toString() ?? "Unavailable"} />
              <Fact label="NAICS" value={lead.searchMetadata.naicsTitle ?? lead.searchMetadata.naicsCode ?? "Unavailable"} />
              <Fact label="NAICS confidence" value={lead.searchMetadata.naicsConfidence == null ? "Unavailable" : `${Math.round(lead.searchMetadata.naicsConfidence * 100)}%`} />
            </dl>
          </section>

          <section className="py-6">
            <p className="text-xs font-medium text-muted">Information gaps</p>
            <h2 className="mt-1.5 text-base font-semibold text-ink">Missing information</h2>
            {analysis.missingInformation.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {analysis.missingInformation.map((item) => <li key={item} className="flex gap-2"><span className="text-warn" aria-hidden="true">—</span><span>{item}</span></li>)}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">No critical gaps. Complete the final human review.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

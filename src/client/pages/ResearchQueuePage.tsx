import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { LeadQueueItem } from "../../shared/contracts";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { DecisionBadge, PriorityBadge, formatDecision } from "../components/StatusBadge";
import { useLeads } from "../hooks/useLeads";
import {
  effectiveDecision,
  filterAndSortLeads,
  type DecisionFilter,
  type SortOption,
} from "../utils/queue";

const controlClass = "h-11 rounded-lg border border-line-strong bg-panel-strong px-3 text-sm text-ink outline-none transition hover:border-muted focus:border-acid";

function QueueSkeleton() {
  return (
    <div className="divide-y divide-line/70" aria-label="Loading research queue" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[minmax(240px,2fr)_repeat(5,minmax(100px,1fr))] gap-5 px-6 py-5">
          <div><div className="h-4 w-40 rounded bg-white/8" /><div className="mt-2 h-3 w-56 rounded bg-white/5" /></div>
          {Array.from({ length: 5 }, (_, cellIndex) => <div key={cellIndex} className="h-7 w-16 rounded bg-white/6" />)}
        </div>
      ))}
    </div>
  );
}

function MobileLeadCard({ lead }: { lead: LeadQueueItem }) {
  return (
    <article className="rounded-xl border border-line bg-panel px-5 py-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold"><Link to={`/leads/${lead.leadId}`} className="text-ink no-underline transition hover:text-acid">{lead.company}</Link></h3>
          <p className="mt-1 text-xs leading-5 text-muted">{lead.industry ?? "Industry unavailable"}</p>
          <p className="text-xs leading-5 text-muted">{lead.location}</p>
        </div>
        <PriorityBadge label={lead.enrichmentPriorityLabel} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-line/70 py-4">
        <div><dt className="font-mono text-[9px] uppercase tracking-wider text-muted">Fit</dt><dd className="mt-1 font-mono text-lg text-mint">{lead.initialFitScore}</dd></div>
        <div><dt className="font-mono text-[9px] uppercase tracking-wider text-muted">Confidence</dt><dd className="mt-1 font-mono text-lg text-ink">{lead.dataConfidenceScore}</dd></div>
        <div><dt className="font-mono text-[9px] uppercase tracking-wider text-muted">Research</dt><dd className="mt-1 font-mono text-lg text-ink">{lead.enrichmentPriorityScore}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-muted">Recommendation</p>
          <DecisionBadge decision={lead.recommendedDecision} />
        </div>
        <div className="text-right">
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-muted">Analyst decision</p>
          {lead.analystDecision ? (
            <DecisionBadge decision={lead.analystDecision} />
          ) : (
            <span className="text-xs text-muted">Not reviewed</span>
          )}
        </div>
      </div>
      <Link to={`/leads/${lead.leadId}`} className="mt-5 flex w-full items-center justify-center rounded-lg border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink no-underline transition hover:border-acid hover:text-acid">
        View lead
      </Link>
    </article>
  );
}

export function ResearchQueuePage() {
  const { leads, isLoading, error, reload } = useLeads();
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [minimumFit, setMinimumFit] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("priority");

  const industries = useMemo(
    () => [...new Set(leads.map((lead) => lead.industry).filter((industry): industry is string => Boolean(industry)))].sort(),
    [leads],
  );

  const visibleLeads = useMemo(() => {
    return filterAndSortLeads(leads, {
      decisionFilter,
      industryFilter,
      minimumFit,
      sortBy,
    });
  }, [decisionFilter, industryFilter, leads, minimumFit, sortBy]);

  const queueMetrics = useMemo(() => ({
    highPriority: leads.filter((lead) => lead.enrichmentPriorityLabel === "High").length,
    research: leads.filter((lead) => effectiveDecision(lead) === "RESEARCH").length,
    shortlist: leads.filter((lead) => effectiveDecision(lead) === "SHORTLIST").length,
  }), [leads]);

  const filtersAreActive = decisionFilter !== "ALL" || industryFilter !== "ALL" || minimumFit > 0;
  const resetFilters = () => {
    setDecisionFilter("ALL");
    setIndustryFilter("ALL");
    setMinimumFit(0);
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
      <section className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-acid">Research queue</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">Decide where to look next.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Compare fit, evidence quality, and research value without treating an automated score as a human decision.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
          <div className="border-l border-line pl-4"><strong className="block font-mono text-2xl text-acid">{leads.length}</strong><span className="text-[11px] text-muted">Total leads</span></div>
          <div className="border-l border-line pl-4"><strong className="block font-mono text-2xl text-warn">{queueMetrics.highPriority}</strong><span className="text-[11px] text-muted">High priority</span></div>
          <div className="border-l border-line pl-4"><strong className="block font-mono text-2xl text-mint">{queueMetrics.shortlist}</strong><span className="text-[11px] text-muted">Shortlisted</span></div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-line bg-panel/90 p-4 shadow-xl shadow-black/10 sm:p-5" aria-label="Queue filters">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1.6fr_1fr_auto] xl:items-end">
          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-muted">
            Decision
            <select className={controlClass} value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as DecisionFilter)}>
              <option value="ALL">All decisions</option>
              <option value="SHORTLIST">Shortlist</option>
              <option value="RESEARCH">Research</option>
              <option value="REJECT">Reject</option>
            </select>
          </label>

          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-muted">
            Industry
            <select className={controlClass} value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
              <option value="ALL">All industries</option>
              {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
            </select>
          </label>

          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-muted">
            <span className="flex justify-between"><span>Minimum fit</span><span className="text-acid">{minimumFit}</span></span>
            <input className="h-11 cursor-pointer accent-acid" type="range" min="0" max="100" step="5" value={minimumFit} onChange={(event) => setMinimumFit(Number(event.target.value))} />
          </label>

          <label className="grid gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-muted">
            Sort by
            <select className={controlClass} value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
              <option value="priority">Enrichment priority</option>
              <option value="fit">Initial fit</option>
              <option value="confidence">Data confidence</option>
              <option value="company">Company name</option>
            </select>
          </label>

          <button type="button" onClick={resetFilters} disabled={!filtersAreActive} className="h-11 rounded-lg border border-line-strong px-4 text-sm font-medium text-ink transition hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-35">
            Reset
          </button>
        </div>
        <p className="mt-4 text-xs text-muted">Decision filtering uses the analyst decision when present; otherwise it uses the Shortlist recommendation.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-panel/95 shadow-2xl shadow-black/20" aria-label="Lead research queue">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Priority view</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-ink">Companies requiring attention</h2>
          </div>
          {!isLoading && !error && <span className="font-mono text-xs text-muted">{visibleLeads.length} of {leads.length}</span>}
        </div>

        {isLoading ? (
          <QueueSkeleton />
        ) : error ? (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div><div className="mx-auto grid size-11 place-items-center rounded-full border border-danger/30 bg-danger/10 font-mono text-danger">!</div><h3 className="mt-4 font-semibold text-ink">Queue unavailable</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted">{error}</p><button type="button" onClick={reload} className="mt-5 rounded-lg bg-acid px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-acid/90">Try again</button></div>
          </div>
        ) : visibleLeads.length === 0 ? (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div><p className="font-mono text-xs uppercase tracking-wider text-acid">No matches</p><h3 className="mt-3 font-semibold text-ink">No leads meet these filters</h3><p className="mt-2 text-sm text-muted">Reduce the minimum fit or clear one of the selected filters.</p><button type="button" onClick={resetFilters} className="mt-5 rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium text-ink transition hover:border-acid hover:text-acid">Clear filters</button></div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead><tr className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted"><th className="px-6 py-3 font-medium">Company</th><th className="px-5 py-3 font-medium">Initial fit</th><th className="px-5 py-3 font-medium">Confidence</th><th className="px-5 py-3 font-medium">Enrichment</th><th className="px-5 py-3 font-medium">Recommendation</th><th className="px-5 py-3 font-medium">Analyst decision</th><th className="px-5 py-3 font-medium">Action</th></tr></thead>
                <tbody>
                  {visibleLeads.map((lead) => (
                    <tr key={lead.leadId} className="border-t border-line/75 transition hover:bg-acid/[0.025]">
                      <td className="px-6 py-5"><strong className="block text-sm"><Link to={`/leads/${lead.leadId}`} className="text-ink no-underline transition hover:text-acid">{lead.company}</Link></strong><span className="mt-1 block text-xs text-muted">{lead.industry ?? "Industry unavailable"} · {lead.location}</span></td>
                      <td className="px-5 py-5"><ScoreDisplay score={lead.initialFitScore} label="Initial fit" /></td>
                      <td className="px-5 py-5"><ScoreDisplay score={lead.dataConfidenceScore} label="Data confidence" tone="neutral" /></td>
                      <td className="px-5 py-5"><div className="flex items-center gap-2"><span className="font-mono text-sm text-ink">{lead.enrichmentPriorityScore}</span><PriorityBadge label={lead.enrichmentPriorityLabel} /></div></td>
                      <td className="px-5 py-5"><DecisionBadge decision={lead.recommendedDecision} /></td>
                      <td className="px-5 py-5">{lead.analystDecision ? <DecisionBadge decision={lead.analystDecision} /> : <span className="text-xs text-muted">Not reviewed</span>}</td>
                      <td className="px-5 py-5"><Link to={`/leads/${lead.leadId}`} aria-label={`View ${lead.company}`} className="whitespace-nowrap rounded-md border border-line-strong px-3 py-2 text-xs font-semibold text-ink no-underline transition hover:border-acid hover:text-acid">View lead</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 bg-canvas/35 p-3 md:hidden">
              {visibleLeads.map((lead) => <MobileLeadCard key={lead.leadId} lead={lead} />)}
            </div>
          </>
        )}
      </section>

      <aside className="mt-5 flex flex-col gap-2 border-l-2 border-acid/50 pl-4 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p><strong className="text-ink">How to read this queue:</strong> High enrichment priority means a promising lead has important unanswered questions.</p>
        <p className="font-mono text-[10px] uppercase tracking-wider">{queueMetrics.research} need research</p>
      </aside>
    </main>
  );
}

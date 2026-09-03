# DealLens: Shortlist

DealLens is an explainable acquisition-research prototype that turns a raw list of companies into a prioritized analyst queue. The application, called **Shortlist** in the interface, helps an analyst answer three practical questions:

1. Does this company appear to fit the acquisition thesis?
2. How trustworthy and complete is the available evidence?
3. What should be researched next before making a decision?

Instead of hiding those answers behind a black-box score, Shortlist shows the rules, evidence gaps, and reasoning behind every recommendation. The result is a focused workflow for moving a lead to **Shortlist**, **Research**, or **Reject** while keeping a human analyst in control.

> **Prototype note:** This repository uses a fictional 20-company dataset and a clearly labelled demo acquisition thesis. The data and rules are for product demonstration only; they are not Caprae or SaaSquatch investment criteria.

## The problem

Company discovery is only the beginning of acquisition research. A search can return hundreds of possible businesses, but an analyst still has to open each record, check whether it fits the target market, judge whether the available data is reliable, identify missing information, and decide where to spend limited research time.

That creates a second bottleneck after discovery: the team has leads, but no consistent and explainable way to prioritize them.

## The solution

Shortlist adds a decision layer after lead discovery. It converts each lead into an explainable analysis containing:

- an **Initial Fit Score** based on information available before costly enrichment;
- a separate **Data Confidence Score** so apparent fit is not confused with evidence quality;
- an **Enrichment Priority** that directs research toward promising leads with important gaps;
- a concise list of **Missing Information**;
- one recommended **Next Research Action**; and
- a system recommendation of **Shortlist**, **Research**, or **Reject**.

Analysts can review the recommendation and record their own decision independently. The system recommendation is never overwritten, so the interface preserves the distinction between automated pre-qualification and human judgment.

## Why this feature

The prototype complements a lead-discovery product rather than trying to reproduce it. The observed upstream workflow already handles basic company search, shared NAICS classification metadata, optional revenue enrichment, and AI-assisted keyword scoring. Shortlist starts where that workflow leaves off: it organizes the returned leads into a transparent research queue and explains what the analyst should do next.

This scope also keeps the prototype focused. It does not scrape websites, send outreach, manage a CRM, or pretend to make a complete acquisition decision. Its job is to reduce repetitive triage while making uncertainty visible.

## What you can do

- Review all leads in a desktop table or responsive mobile card layout.
- Filter by recommendation, industry, and minimum fit score.
- Sort by enrichment priority, initial fit, data confidence, or company name.
- Open a lead to inspect its company data and complete scoring breakdown.
- See failed or missing enrichment without losing the rest of the analysis.
- Follow a single recommended next research action.
- Record or clear an analyst decision without changing the system recommendation.
- Use the same workflow through a small JSON API.

## Demo walkthrough

The core flow is:

```text
Raw lead
   |
   v
Initial fit ------> Is the company broadly relevant?
   |
   v
Enrichment priority -> Is this lead worth more research effort?
   |
   v
Data confidence ---> How reliable is the current evidence?
   |
   v
Next research action -> Which unresolved fact matters most?
   |
   v
System recommendation + independent analyst decision
```

For a short demonstration:

1. Open the research queue and show that leads are ordered by enrichment priority by default.
2. Use the decision and industry filters, then adjust the minimum-fit control.
3. Open a strong lead and review the Initial Fit and Data Confidence breakdowns.
4. Open a lead with missing or failed revenue data to show graceful degradation and the recommended next action.
5. Record an analyst decision and return to the queue to show that it is displayed separately from the system recommendation.

## Demo acquisition thesis

The current rule set targets:

- **Industries:** Software Development, Healthcare Software, and Vertical Software
- **Country:** USA
- **Estimated revenue:** $2 million to $20 million
- **Preferred ownership:** Founder-owned

The thesis is centralized in [`src/server/config/thesis.ts`](src/server/config/thesis.ts). It is deliberately simple so that every score can be understood and verified during the demo.

## How scoring works

All core scoring is deterministic. No language model is required to rank a lead or produce a recommendation.

### Initial Fit Score

Initial Fit is a pre-qualification score using fields that should be available before expensive enrichment.

| Criterion | Maximum points |
| --- | ---: |
| Target industry match | 50 |
| Target country match | 25 |
| Valid HTTP/HTTPS website | 10 |
| NAICS classification confidence | 15 |
| **Total** | **100** |

The NAICS component is proportional to its confidence value. For example, a confidence of `0.80` contributes 12 of the available 15 points.

### Data Confidence Score

Confidence is intentionally separate from fit. A company can look attractive while still having weak evidence.

| Evidence | Maximum points |
| --- | ---: |
| Industry is known | 20 |
| Country is known | 15 |
| Website is verifiable | 10 |
| Revenue evidence | 30 |
| Ownership is known | 25 |
| **Total** | **100** |

Revenue contributes 30 points at high confidence, 18 at medium confidence, 9 at low confidence, and 0 when missing or failed.

### Enrichment Priority

The priority score balances likely fit with decision-critical gaps:

```text
Enrichment Priority = (Initial Fit x 0.7) + (Missing Critical Data x 0.3)
```

Missing revenue, unknown ownership, uncertain classification, and an invalid or absent website contribute to the critical-data score. This means a promising but incomplete lead rises above an obviously poor-fit lead with the same missing information.

Priority labels are assigned as follows:

- **High:** 75 or more
- **Medium:** 50–74
- **Low:** below 50

### Recommendation rules

- **Reject** when reliable known evidence shows an industry or country mismatch, or medium/high-confidence revenue is outside the target range.
- **Shortlist** when Initial Fit is at least 80, Data Confidence is at least 70, reliable revenue is within range, and founder ownership is verified.
- **Research** in every unresolved case where the lead is not reliably disqualified but one or more important questions remain.

The scoring and recommendation implementation lives in [`src/server/services/analysis.service.ts`](src/server/services/analysis.service.ts).

## Failure handling

Optional enrichment should improve a decision, not make the entire workflow fragile. Revenue values are normalized into explicit `available`, `missing`, or `failed` states. Provider error messages and malformed values are treated as failed evidence rather than causing the page or API request to fail.

When enrichment is unavailable:

- the lead still receives an Initial Fit Score;
- unavailable evidence contributes no confidence points;
- the missing information is shown to the analyst;
- the next action recommends manual verification where appropriate; and
- the recommendation remains **Research** unless reliable evidence supports another result.

The revenue parser preserves the original provider value for traceability while preventing it from being presented as a verified number.

## Architecture

The prototype is a small full-stack TypeScript application:

```text
React client
  |  fetch /api/*
  v
Express API
  |
  +--> Lead repository --------> data/demo-leads.json
  |
  +--> Revenue parser
  |
  +--> Deterministic analysis service
          |-- Initial fit
          |-- Data confidence
          |-- Enrichment priority
          |-- Next research action
          +-- Recommendation
```

The Vite development server proxies `/api` requests to Express. In production, Express serves both the compiled React files and the API from one process, so the client and API remain on the same origin.

### Project structure

```text
data/
  demo-leads.json              Fictional demonstration dataset
src/
  client/
    api/                       Browser API client
    components/                Reusable scores, badges, and metrics
    hooks/                     Queue and detail data state
    pages/                     Research Queue and Lead Details screens
    tests/                     Client-side business and formatting tests
  server/
    config/                    Demo investment thesis
    controllers/               HTTP request handling and validation
    repositories/              Demo data and analyst decision storage
    routes/                    Express route definitions
    services/                  Input adapter and scoring/decision logic
    tests/                     API and domain tests
    utils/                     Revenue and website parsing
  shared/
    contracts.ts               Types shared by client and server
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- npm (included with Node.js)
- Git

No database, API key, or environment file is required for the prototype.

### Installation

```bash
git clone https://github.com/chaitanyagalla/DealLens.git
cd DealLens
npm ci
```

### Run in development

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). This command starts:

- the Vite client on `http://localhost:5173`; and
- the Express API on `http://localhost:3001`.

Both processes reload automatically while you work. Press `Ctrl+C` to stop them.

### Create and run a production build

```bash
npm run build
npm start
```

Open [http://localhost:3001](http://localhost:3001). The production server uses the `PORT` environment variable when provided and otherwise defaults to port `3001`.

## API demonstration

The API can be explored in a browser for `GET` requests or with curl, Postman, Insomnia, or a similar client.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirm that the service is running |
| `GET` | `/api/leads` | Return the analyzed research queue |
| `GET` | `/api/leads/:id` | Return source data, analysis, and analyst decision for one lead |
| `PATCH` | `/api/leads/:id/decision` | Record or clear the analyst's decision |

Example requests:

```bash
# Service health
curl http://localhost:3001/api/health

# Complete queue
curl http://localhost:3001/api/leads

# One lead with its scoring breakdown
curl http://localhost:3001/api/leads/dl-001

# Record an independent analyst decision
curl -X PATCH http://localhost:3001/api/leads/dl-001/decision \
  -H "Content-Type: application/json" \
  -d '{"decision":"SHORTLIST"}'

# Clear the analyst decision
curl -X PATCH http://localhost:3001/api/leads/dl-001/decision \
  -H "Content-Type: application/json" \
  -d '{"decision":null}'
```

Valid decision values are `SHORTLIST`, `RESEARCH`, `REJECT`, and `null`. Unknown leads, invalid decisions, and unknown API routes return consistent JSON error objects with an appropriate HTTP status.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the client and API together with file watching |
| `npm run dev:client` | Run only the Vite development server |
| `npm run dev:server` | Run only the Express API with file watching |
| `npm test` | Run the complete Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check the server and client projects |
| `npm run build` | Build the React client and compile the server |
| `npm start` | Start the compiled production application |

## Testing

Run the automated tests with:

```bash
npm test
```

Run the compiler checks with:

```bash
npm run typecheck
```

The suite covers:

- SaaSquatch-style response normalization;
- revenue parsing, missing values, malformed values, and provider failures;
- Initial Fit, Data Confidence, and Enrichment Priority calculations;
- next-action and final-recommendation rules;
- API health, queue, details, validation, errors, and decision updates;
- queue filtering and sorting; and
- safe URL and lead-detail formatting.

## Dataset

[`data/demo-leads.json`](data/demo-leads.json) contains 20 fictional companies designed to exercise meaningful paths through the product, including:

- strong, fully supported matches;
- missing or low-confidence revenue;
- a simulated enrichment-provider failure;
- out-of-range revenue;
- non-target countries and industries;
- ambiguous classifications;
- unknown ownership; and
- invalid or missing websites.

The `.example` domains and fictional company names are intentional. The dataset is safe to include in the repository and does not represent real people or businesses.

## Current limitations

This is a time-boxed product prototype, not a production underwriting system.

- Leads are loaded from a local JSON file rather than a live SaaSquatch connection.
- Analyst decisions are stored in memory and reset whenever the server restarts.
- The demo thesis is configured in code rather than through an administrative interface.
- The scores are pre-qualification aids, not valuations or final investment recommendations.
- The application has no authentication or user-level authorization.
- Enrichment is represented by fixture data; the prototype does not call an external provider.

## Production roadmap

A production version would preserve the transparent decision model while replacing the prototype infrastructure:

1. Integrate with the real SaaSquatch search and enrichment interfaces through versioned adapters.
2. Store leads, source timestamps, evidence provenance, thesis versions, and analyst decisions in PostgreSQL.
3. Move enrichment into retryable background jobs so slow or failed providers never block the analyst queue.
4. Cache computed analysis and costly enrichment results in Redis, invalidating them when the lead, enrichment, or thesis changes.
5. Add authentication, role-based access, audit history, rate limiting, and structured request validation.
6. Make acquisition theses configurable and re-run analysis when a thesis version changes.
7. Add centralized logs, metrics, tracing, and alerts for enrichment failures and data-quality regressions.
8. Add CSV import/export and carefully scoped integrations with existing analyst tools.

AI-generated summaries could be added after the structured analysis, but the rules and fallback explanations should remain fully functional when an AI provider is slow or unavailable.

## Security and responsible use

- Keep provider credentials on the server and out of client bundles and source control.
- Validate imported records and allow only safe HTTP/HTTPS links before rendering external URLs.
- Preserve confidence and provenance instead of presenting uncertain enrichment as fact.
- Respect source terms of service, privacy expectations, and API rate limits.
- Do not bypass access controls, CAPTCHAs, certificate checks, or other security protections.
- Keep a human reviewer responsible for the final business decision.

## Design decisions

**Why deterministic scoring?** It makes every point inspectable, testable, and easy to discuss with an analyst. The same input always produces the same output.

**Why separate fit from confidence?** A lead can match the thesis while relying on incomplete evidence. Combining the two would create false certainty and hide the reason more research is needed.

**Why prioritize enrichment?** External research has a cost. The application should spend that effort on leads that look promising and have gaps capable of changing the decision.

**Why keep the analyst decision separate?** The software supports judgment; it does not replace it. Showing both values makes disagreement visible and creates a useful foundation for later calibration.

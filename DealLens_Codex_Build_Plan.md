# DealLens — Detailed Build Plan for Codex Agent

## 0. Purpose of This Document

This file is the build guide for the Caprae Capital Full Stack Developer pre-work challenge.

The goal is **not** to recreate SaaSquatch Leads or build another scraper.

The goal is to build a focused enhancement that sits **after lead discovery** and helps an analyst answer:

1. Is this company worth looking at?
2. How strong is the fit?
3. How much of the decision is based on reliable data?
4. What important information is missing?
5. What should I research or enrich next?
6. Should I shortlist, research, or reject this lead?

Working product name:

# DealLens — Acquisition Lead Decision Engine

---

# 1. Important Instructions for the Codex Agent

## 1.1 Never generate unexplained code

For **every file created or modified**, do all of the following:

1. Explain what the file is responsible for.
2. Explain why it is needed.
3. Explain how it connects to the rest of the application.
4. Explain the important code before or immediately after generating it.
5. For every important function:
   - explain inputs,
   - explain outputs,
   - explain business purpose,
   - explain edge cases.
6. Explain any library or framework choice before using it.
7. Explain any architectural decision before implementing it.
8. Explain how to test the code after each step.
9. Do not generate a large amount of code at once without explanation.
10. Build incrementally and wait for confirmation after each logical milestone if possible.

When writing code, prefer:

- clear naming,
- small functions,
- predictable control flow,
- comments only where they add value,
- simple architecture over unnecessary complexity.

Do **not** add tools, frameworks, databases, queues, caching layers, or AI just to look advanced.

---

## 1.2 Teaching requirement

The developer using this plan wants to understand the code.

For every implementation step, use this structure:

### What we are building
Short explanation.

### Why we need it
Business and technical reason.

### Files involved
List of files.

### Code
Generate only the code required for this step.

### How the code works
Explain the important lines and data flow.

### How to test
Give exact manual or automated test steps.

### What can go wrong
Mention likely bugs or edge cases.

### Next step
State what comes next.

---

# 2. Challenge Constraints

The interview handbook asks candidates to:

- analyze the existing SaaSquatch lead-generation product,
- spend **no more than 5 hours** engineering one or two impactful features,
- explain UX choices and backend architecture,
- discuss data storage,
- discuss caching/performance,
- discuss hosting/deployment/cloud choices,
- submit code in GitHub,
- provide a README,
- provide a short video walkthrough.

The evaluation emphasizes:

- business use-case understanding,
- prioritizing useful leads,
- reducing irrelevant data,
- fitting into sales/research workflows,
- UX simplicity,
- technical quality,
- data quality,
- enrichment/validation,
- creativity,
- clear documentation.

This project should therefore optimize for **clarity and product value**, not maximum feature count.

---

# 3. What Was Observed in the Real SaaSquatch Product

These observations came from direct use of the logged-in product.

## 3.1 Base company search

A request was observed with input similar to:

```json
{
  "industry": "Custom Computer Programming Services",
  "location": "Austin, TX, USA"
}
```

The response structure looked like:

```json
{
  "count": 150,
  "naics": {
    "code": "541511",
    "confidence": 0.8025,
    "level": 6,
    "title": "Custom Computer Programming Services"
  },
  "results": [
    {
      "city": "Austin",
      "company": "Ecaresoft",
      "country": "USA",
      "industry": "Healthcare Software",
      "lead_id": "716e6b487cc0fd0240175ce2aa0065a9",
      "state": "TX",
      "website": "http://ecaresoft.com"
    }
  ]
}
```

This means the observable base lead contains at least:

- `lead_id`
- `company`
- `website`
- `industry`
- `city`
- `state`
- `country`

It also returns NAICS classification information:

- code,
- title,
- confidence,
- level.

---

## 3.2 Industry classification behavior

An earlier search for "Software Development" mapped to an incorrect NAICS category with low confidence.

A more precise industry term mapped correctly.

This suggests that **classification confidence can matter** and should be considered as useful context.

Do not claim the product is always wrong.

Use this only as motivation for transparent confidence handling.

---

## 3.3 Revenue enrichment behavior

The product has an "Estimate Revenue" action.

Observed successful responses looked similar to:

```json
{
  "Company": "Nueve",
  "revenue": "Estimated Revenue: 5m - medium"
}
```

Other companies returned errors similar to:

```json
{
  "Company": "Ecaresoft",
  "revenue": "error: All Gemini models failed to generate response"
}
```

Therefore, enrichment is not guaranteed to succeed.

The DealLens prototype should remain usable even when enrichment is:

- missing,
- low confidence,
- unavailable,
- failed.

---

## 3.4 Existing AI scoring

The product already contains AI scoring with user-entered keyword groups:

### Positive
- Critical: must be present.
- Ideal: nice to have.

### Negative
- Critical: exclude.
- Ideal: lowers the score.

This means DealLens must **not** be another generic keyword AI scoring feature.

DealLens should solve a different problem:

> turning lead information into a research decision and next action.

---

## 3.5 AI scoring service failure

The scoring endpoint returned a browser/network failure:

`ERR_CERT_DATE_INVALID`

Do not attempt to bypass or fix the external product's security/certificate issue.

Use this observation only as motivation for a design principle:

> Core lead qualification should still work when optional AI or enrichment services are unavailable.

---

# 4. Product Problem

## Problem Statement

Lead discovery is only the beginning.

A user may find 150 companies, but still has to manually determine:

- which companies are worth researching,
- which leads fit the desired business criteria,
- which data can be trusted,
- which information is missing,
- which companies deserve enrichment,
- and what action to take next.

This creates a second bottleneck after lead discovery.

---

# 5. Proposed Solution

## DealLens

DealLens takes SaaSquatch-style lead data and creates an explainable research queue.

It produces:

- Initial Fit Score
- Data Confidence Score
- Enrichment Priority
- Missing Information
- Next Research Action
- Final Decision State:
  - Shortlist
  - Research
  - Reject

The important idea:

> SaaSquatch finds companies. DealLens helps decide what to do with them.

---

# 6. Primary User

The primary user for the prototype is:

**An analyst reviewing companies for acquisition, investment, partnership, or structured business outreach.**

The product should also make sense for:

- sales teams,
- business development,
- search-fund analysts,
- private equity research,
- founders doing targeted outbound.

But the UI and explanation should focus on the analyst workflow.

---

# 7. User Workflow

## Current workflow

```text
Search companies
    ↓
Receive 100+ leads
    ↓
Open each lead
    ↓
Check industry
    ↓
Check location
    ↓
Estimate revenue
    ↓
Review website
    ↓
Find missing information
    ↓
Decide if worth further research
    ↓
Repeat
```

## DealLens workflow

```text
Search results
    ↓
Basic qualification
    ↓
Rank leads
    ↓
Identify leads worth enrichment
    ↓
Evaluate available enrichment
    ↓
Show confidence + missing data
    ↓
Recommend next research step
    ↓
Shortlist / Research / Reject
```

---

# 8. MVP Scope

Build only the following.

## Required

1. Research Queue
2. Lead Details
3. Initial Fit Score
4. Data Confidence Score
5. Enrichment Priority
6. Missing Information
7. Next Research Recommendation
8. Shortlist / Research / Reject
9. Filtering/sorting by decision or score
10. Graceful handling of failed/missing enrichment

## Optional only if time remains

11. Simple configurable thesis
12. AI-generated human-readable explanation
13. CSV import
14. CSV export

## Explicitly out of scope

Do not build:

- a scraper,
- authentication,
- payments,
- subscriptions,
- CRM integration,
- email sending,
- LinkedIn automation,
- a chatbot,
- microservices,
- Kafka,
- Kubernetes,
- Redis implementation,
- complicated background jobs,
- a full production database unless needed.

---

# 9. Suggested Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router if needed
- CSS Modules, Tailwind

Choose one styling approach only.

## Backend

- Node.js
- Express
- TypeScript

## Data

For the interview MVP:

- local JSON data or in-memory repository

Optional:

- SQLite

Do not spend significant time configuring PostgreSQL for a five-hour prototype.

In the README, describe PostgreSQL as a production option.

## Testing

- Vitest for business logic
- Supertest if API tests are added

---

# 10. High-Level Architecture

```text
                   SaaSquatch-style Lead Data
                              |
                              v
                    ---------------------
                    | Lead Data Adapter |
                    ---------------------
                              |
                              v
                    ----------------------
                    | Qualification      |
                    | Engine             |
                    ----------------------
                              |
              -------------------------------
              |                             |
              v                             v
     --------------------          --------------------
     | Confidence Engine |          | Enrichment      |
     |                   |          | Priority Engine |
     --------------------          --------------------
              |                             |
              -----------       -------------
                        \       /
                         v     v
                    ---------------------
                    | Decision Engine   |
                    ---------------------
                              |
                              v
                    ---------------------
                    | Express API       |
                    ---------------------
                              |
                              v
                    ---------------------
                    | React UI          |
                    | Research Queue    |
                    | Lead Details      |
                    ---------------------
```

---

# 11. Data Model

## 11.1 Base SaaSquatch-style lead

Use a model close to the observed response.

```ts
export interface BaseLead {
  leadId: string;
  company: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}
```

---

## 11.2 Search metadata

```ts
export interface SearchMetadata {
  naicsCode: string | null;
  naicsTitle: string | null;
  naicsConfidence: number | null;
}
```

---

## 11.3 Optional enrichment

These fields were **not all observed in the base search response**.

They are prototype enrichment fields and must be clearly treated as optional.

```ts
export type EnrichmentStatus =
  | "available"
  | "missing"
  | "failed"
  | "not_requested";

export interface RevenueEnrichment {
  estimatedRevenue: number | null;
  confidence: "low" | "medium" | "high" | null;
  status: EnrichmentStatus;
  rawValue?: string | null;
}

export interface OptionalEnrichment {
  revenue: RevenueEnrichment;
  employeeCount?: number | null;
  ownershipType?: "founder_owned" | "other" | "unknown";
  yearFounded?: number | null;
}
```

---

## 11.4 Decision output

```ts
export type LeadDecision =
  | "SHORTLIST"
  | "RESEARCH"
  | "REJECT";

export interface LeadAnalysis {
  leadId: string;

  initialFitScore: number;
  dataConfidenceScore: number;
  enrichmentPriorityScore: number;

  fitReasons: string[];
  confidenceIssues: string[];
  missingInformation: string[];

  nextResearchAction: string;
  decision: LeadDecision;
}
```

---

# 12. Demo Investment Thesis

The prototype needs a configurable rule set.

Do not present these as Caprae's official criteria.

Label them:

**Demo Acquisition Thesis**

Example:

```ts
export interface InvestmentThesis {
  targetIndustries: string[];
  targetCountries: string[];
  revenueMin?: number;
  revenueMax?: number;
  preferredOwnership?: "founder_owned";
}
```

Example default thesis:

```json
{
  "targetIndustries": [
    "Software Development",
    "Healthcare Software",
    "Vertical Software"
  ],
  "targetCountries": ["USA"],
  "revenueMin": 2000000,
  "revenueMax": 20000000,
  "preferredOwnership": "founder_owned"
}
```

---

# 13. Scoring Strategy

The scoring must be deterministic and explainable.

Do not use an LLM to create the core score.

## 13.1 Initial Fit Score

This score should use only information already available before expensive enrichment.

Example weights:

| Criterion | Points |
|---|---:|
| Industry match | 50 |
| Country/location match | 25 |
| Website available | 10 |
| Search/NAICS confidence | 15 |
| Total | 100 |

Example:

```text
Healthcare Software
USA
Website present
NAICS confidence = 0.80

Industry        50/50
Country         25/25
Website         10/10
Classification  12/15

Initial Fit = 97
```

Do not pretend this is a final acquisition score.

It is only:

**Initial Fit / Pre-Qualification**

---

# 14. Enrichment Priority

This should answer:

> Which leads deserve more API/research effort first?

Example approach:

```text
High initial fit + important missing data
= high enrichment priority
```

Possible formula:

```ts
enrichmentPriority =
  initialFitScore * 0.7 +
  missingCriticalDataScore * 0.3;
```

Keep it simple.

Example:

```text
Lead A
Initial Fit: 92
Revenue: missing

→ Enrichment Priority: HIGH
```

```text
Lead B
Initial Fit: 25
Revenue: missing

→ Enrichment Priority: LOW
```

This is valuable because users should not spend effort enriching obviously poor-fit leads.

---

# 15. Data Confidence Score

This score answers:

> How much do we trust the data currently available for this decision?

Use availability and confidence, not business fit.

Example:

| Field | Weight |
|---|---:|
| Industry | 20 |
| Location | 15 |
| Website | 10 |
| Revenue | 30 |
| Ownership | 25 |

Example rules:

- available + high confidence = full points,
- available + medium confidence = partial points,
- missing = 0,
- failed = 0 and add a warning.

Example:

```text
Industry       known       20/20
Location       known       15/15
Website        known       10/10
Revenue        medium      18/30
Ownership      unknown      0/25

Confidence = 63
```

---

# 16. Missing Information Logic

Create a function that identifies missing fields that matter.

Example:

```ts
function findMissingInformation(
  lead: BaseLead,
  enrichment: OptionalEnrichment
): string[]
```

Possible output:

```json
[
  "Revenue",
  "Ownership"
]
```

Do not list every possible missing field.

Only list fields relevant to the decision.

---

# 17. Next Research Action

This is one of the core differentiators.

The product should not only say what is missing.

It should say what should be checked next.

Example:

```text
Next research action:
Verify estimated revenue.

Why:
The company strongly matches the target industry,
but revenue is required to determine whether it fits
the acquisition-size range.
```

Decision logic should prefer information that:

1. is missing,
2. matters to the thesis,
3. could materially change the decision.

Example priority order:

1. Revenue
2. Ownership
3. Industry ambiguity
4. Website/company identity
5. Employee size if included

---

# 18. Final Decision Logic

Use a simple matrix.

## SHORTLIST

Conditions might be:

- high final fit,
- acceptable confidence,
- no critical missing information.

## RESEARCH

Conditions might be:

- high fit but low confidence,
- important missing information,
- enrichment failure.

## REJECT

Conditions might be:

- low fit based on reliable known data.

Example:

```text
Fit >= 80 and confidence >= 70
→ SHORTLIST

Fit >= 65 and confidence < 70
→ RESEARCH

Fit < 50 and confidence >= 60
→ REJECT

Otherwise
→ RESEARCH
```

Keep these thresholds in one configuration file.

---

# 19. Failure Handling

The product must treat failures as normal states.

## Revenue failure

Input:

```json
{
  "status": "failed",
  "rawValue": "error: All Gemini models failed to generate response"
}
```

UI:

```text
Revenue
Unavailable

The enrichment service did not return a value.

Next action:
Retry later or verify manually.
```

Do not expose ugly backend error text as the main UI message.

---

## Missing AI scoring

DealLens should not depend on external AI scoring.

If optional AI explanation fails:

- keep deterministic scores,
- keep research recommendations,
- show a non-blocking message.

Example:

```text
AI summary unavailable.
Core qualification is still available.
```

---

# 20. API Design

Keep the API small.

## GET /api/leads

Returns queue-level data.

Example:

```json
[
  {
    "leadId": "123",
    "company": "Ecaresoft",
    "industry": "Healthcare Software",
    "initialFitScore": 92,
    "dataConfidenceScore": 55,
    "enrichmentPriorityScore": 88,
    "decision": "RESEARCH"
  }
]
```

---

## GET /api/leads/:id

Returns full lead + analysis.

---

## PATCH /api/leads/:id/decision

Request:

```json
{
  "decision": "SHORTLIST"
}
```

---

## Optional

### POST /api/leads/:id/enrichment

Use only if simulating enrichment.

Do not build external scraping.

---

# 21. Backend Folder Structure

Suggested structure:

```text
server/
  src/
    app.ts
    server.ts

    data/
      leads.json
      enrichment.json

    models/
      lead.ts
      analysis.ts
      thesis.ts

    config/
      thesis.ts
      scoring.ts

    services/
      qualification.service.ts
      confidence.service.ts
      enrichment-priority.service.ts
      research-action.service.ts
      decision.service.ts
      analysis.service.ts

    repositories/
      lead.repository.ts

    routes/
      leads.routes.ts

    controllers/
      leads.controller.ts

    utils/
      revenue-parser.ts

    tests/
      qualification.service.test.ts
      confidence.service.test.ts
      decision.service.test.ts
```

Do not create unnecessary abstractions.

If a layer provides no real value in the MVP, simplify it.

---

# 22. Frontend Folder Structure

```text
client/
  src/
    main.tsx
    App.tsx

    api/
      leadsApi.ts

    types/
      lead.ts

    pages/
      ResearchQueuePage.tsx
      LeadDetailPage.tsx

    components/
      LeadTable.tsx
      ScoreBadge.tsx
      ConfidenceBadge.tsx
      DecisionBadge.tsx
      MissingInfoList.tsx
      NextResearchCard.tsx
      LeadSummaryCard.tsx

    hooks/
      useLeads.ts
      useLead.ts

    utils/
      scoreLabel.ts

    styles/
      ...
```

---

# 23. Screen 1 — Research Queue

## Goal

Let the user answer:

> Which companies deserve my attention first?

## Table columns

- Company
- Industry
- Location
- Initial Fit
- Data Confidence
- Enrichment Priority
- Decision
- Action/View

Example:

```text
Company           Fit    Confidence   Enrich Priority   Decision
----------------------------------------------------------------
Ecaresoft          92       54             89           RESEARCH
AIMDek             84       72             64           SHORTLIST
Zaiten             77       48             82           RESEARCH
LowFit Example     31       88             20           REJECT
```

## Filters

- decision,
- industry,
- minimum fit,
- enrichment priority.

## Sorting

Allow sorting by:

- fit,
- confidence,
- enrichment priority.

Do not overbuild filters.

---

# 24. Screen 2 — Lead Details

Example layout:

```text
ECARESOFT
Healthcare Software
Austin, TX, USA
ecaresoft.com

---------------------------------------

INITIAL FIT
92 / 100

✓ Industry matches thesis
✓ USA target market
✓ Website available
✓ Strong classification confidence

---------------------------------------

DATA CONFIDENCE
54 / 100

✓ Industry known
✓ Location known
⚠ Revenue unavailable
? Ownership unknown

---------------------------------------

ENRICHMENT PRIORITY
HIGH

Why?
This is a strong initial-fit lead,
but important decision data is missing.

---------------------------------------

WHAT SHOULD I RESEARCH NEXT?

Verify revenue.

Revenue could determine whether this
company fits the target size range.

---------------------------------------

Decision

[ Shortlist ] [ Keep Researching ] [ Reject ]
```

---

# 25. UI Principles

The handbook rewards usability and low complexity.

Use:

- clear hierarchy,
- concise labels,
- visible scores,
- clear status badges,
- obvious next action,
- minimal navigation.

Avoid:

- excessive charts,
- unnecessary animations,
- overly dense dashboards,
- AI-chatbot interfaces,
- huge forms,
- hidden logic.

---

# 26. Sample Dataset

Create approximately 20–30 realistic records.

Include varied cases.

## Required scenarios

1. High fit + good data
2. High fit + revenue missing
3. High fit + revenue failed
4. High fit + low NAICS confidence
5. Medium fit + reliable data
6. Wrong industry
7. Wrong geography
8. Missing website
9. Revenue outside target
10. Unknown ownership
11. Conflicting/low-confidence enrichment
12. Clearly rejectable lead

Use some company names inspired by the observed response only if appropriate.

Avoid copying or exposing sensitive data.

---

# 27. Revenue Parser

Observed revenue values may look like:

```text
Estimated Revenue: 5m - medium
```

Create a parser:

```ts
parseRevenueEstimate(raw: string)
```

Expected output:

```ts
{
  amount: 5000000,
  confidence: "medium"
}
```

Also handle:

```text
error: All Gemini models failed to generate response
```

Output:

```ts
{
  amount: null,
  confidence: null,
  status: "failed"
}
```

Test this function thoroughly.

---

# 28. Testing Strategy

Prioritize business logic tests.

## Qualification tests

Test:

- matching industry,
- non-matching industry,
- USA vs non-USA,
- missing website,
- low classification confidence.

## Confidence tests

Test:

- all enrichment available,
- revenue missing,
- revenue failed,
- ownership unknown.

## Decision tests

Test:

- high fit + high confidence → shortlist,
- high fit + low confidence → research,
- low fit + high confidence → reject.

## Revenue parser tests

Test:

- `5m - medium`,
- `10m - medium`,
- failure string,
- null,
- malformed response.

---

# 29. Five-Hour Build Schedule

## 0:00–0:30 — Setup + data

- create client/server,
- configure TypeScript,
- add sample leads,
- define types,
- confirm both apps run.

Deliverable:
Basic app boots.

---

## 0:30–1:30 — Business logic

Build:

- initial fit scoring,
- revenue parser,
- confidence score,
- missing information,
- enrichment priority,
- decision rules.

Add tests.

Deliverable:
Given a lead, backend can produce a full analysis object.

---

## 1:30–2:15 — API

Build:

- GET `/api/leads`
- GET `/api/leads/:id`
- PATCH decision

Deliverable:
API returns analyzed leads.

---

## 2:15–3:15 — Research Queue

Build:

- table,
- badges,
- sorting/filtering,
- link to lead detail.

Deliverable:
User can identify high-priority companies quickly.

---

## 3:15–4:00 — Lead Detail

Build:

- fit explanation,
- confidence breakdown,
- missing data,
- next research action,
- decision buttons.

Deliverable:
User can understand exactly why a lead is ranked a certain way.

---

## 4:00–4:30 — Failure states + polish

Add:

- failed enrichment UI,
- empty state,
- loading state,
- basic responsive layout,
- error state.

---

## 4:30–5:00 — README + final verification

Add:

- architecture,
- product reasoning,
- limitations,
- production scaling plan,
- screenshots,
- run instructions.

Do not add new features in the last 30 minutes.

---

# 30. README Structure

The final README should include:

## 1. Problem

Explain the post-discovery research bottleneck.

## 2. Solution

Explain DealLens.

## 3. Why this feature

Explain why it complements SaaSquatch rather than duplicates it.

## 4. Observed SaaSquatch workflow

Mention:

- basic lead search,
- NAICS classification,
- revenue enrichment,
- existing AI keyword scoring,
- optional enrichment failures.

Do not overstate conclusions.

## 5. Demo flow

Show:

```text
Raw Lead
→ Initial Fit
→ Enrichment Priority
→ Confidence
→ Next Research Action
→ Decision
```

## 6. Architecture

Include a small diagram.

## 7. Scoring

Explain that scoring is deterministic and transparent.

## 8. Failure handling

Explain graceful degradation.

## 9. Setup instructions

Clear commands.

## 10. Tests

Explain how to run.

## 11. Production roadmap

Mention:

- PostgreSQL,
- Redis for cached analyses,
- queue/background jobs for enrichment,
- real SaaSquatch integration,
- centralized observability,
- configurable investment thesis.

Clearly label these as future/production ideas.

---

# 31. Production Architecture Discussion

Do not implement all of this.

Use it only in the README/video.

```text
SaaSquatch Search / Scraper
          |
          v
      PostgreSQL
          |
          v
    Lead Event / API
          |
          v
   DealLens Service
      |       |
      |       +--> Enrichment Adapters
      |
      +--> Qualification Engine
      |
      +--> Confidence Engine
      |
      +--> Decision Engine
          |
          v
        Redis
   cached analysis
          |
          v
      React App
```

Possible production behavior:

- re-run analysis when source lead data changes,
- cache calculated scores,
- run enrichment asynchronously,
- maintain source timestamps,
- expose confidence and provenance.

---

# 32. Caching Discussion

No Redis is required for MVP.

In production:

Cache:

- computed lead analysis,
- parsed enrichment,
- expensive enrichment calls.

Invalidate when:

- lead data changes,
- enrichment changes,
- thesis configuration changes.

---

# 33. AI Usage

AI is optional.

Core decisions must work without it.

Possible safe use:

```text
Structured analysis
      ↓
LLM
      ↓
Short human explanation
```

Example:

```text
"This company is a strong industry and location match,
but revenue is currently unavailable. Verify revenue
before shortlisting."
```

If AI fails:

- do not break the app,
- fall back to template-based explanation.

Do not send sensitive data unnecessarily.

---

# 34. Security / Ethical Considerations

Mention briefly:

- do not expose API keys in frontend,
- validate imported data,
- sanitize URLs,
- avoid scraping protected/private sources,
- respect rate limits and terms of service,
- do not bypass CAPTCHAs or certificate/security protections,
- avoid presenting uncertain enrichment as fact.

---

# 35. Video Walkthrough Plan

Target: 1–2 minutes.

## 0:00–0:15

Problem:

"SaaSquatch can surface many companies, but the analyst still has to decide which ones deserve research or enrichment."

## 0:15–0:35

Research Queue:

Show:

- fit score,
- confidence,
- enrichment priority,
- decision.

## 0:35–1:05

Open one lead.

Show:

- why it fits,
- what is missing,
- enrichment failure handling,
- next research action.

## 1:05–1:25

Explain architecture:

"Core scoring is deterministic, so the workflow remains usable even when optional AI/enrichment fails."

## 1:25–1:40

Value statement:

"DealLens reduces research effort by helping users enrich and investigate the leads most likely to matter."

---

# 36. Interview Talking Points

Be ready to explain:

## Why not build a scraper?

Because lead discovery already exists.

The problem targeted is post-discovery decision quality.

## Why deterministic scoring?

- explainable,
- testable,
- predictable,
- resilient when AI fails.

## Why separate fit and confidence?

A company can look attractive while the underlying data is weak.

Business fit and data reliability are different questions.

## Why enrichment priority?

Research and enrichment cost time and money.

High-fit leads should get that effort first.

## Why next research action?

Missing data alone is not enough.

The analyst needs to know what information matters most.

---

# 37. Definition of Done

The MVP is complete when:

- [ ] app loads successfully,
- [ ] at least 20 demo leads exist,
- [ ] research queue shows all scores,
- [ ] user can open a lead,
- [ ] lead detail explains fit,
- [ ] confidence is separate from fit,
- [ ] failed revenue enrichment is handled,
- [ ] missing data is shown,
- [ ] next research action is generated,
- [ ] shortlist/research/reject works,
- [ ] scoring logic has tests,
- [ ] README explains architecture,
- [ ] no secrets exist in repository,
- [ ] app can be demonstrated in under two minutes.

---

# 38. Stop Conditions

Do not add another feature if:

- core scoring is not tested,
- the detail page is unclear,
- failure states are broken,
- README is incomplete,
- video flow is not understandable.

Polish the core product instead.

---

# 39. First Task for the Codex Agent

Start with **only Phase 1**.

Before generating code:

1. restate the product problem,
2. restate the MVP,
3. propose the minimal project structure,
4. explain the selected stack,
5. explain why each dependency is required,
6. wait for confirmation if interactive mode permits.

Then create:

- client,
- server,
- shared TypeScript types if useful,
- 5 initial demo leads only,
- no scoring logic yet.

After setup, explain every generated file and how to run both apps.

Do not proceed to scoring until the setup is confirmed working.

---

# 40. Final Principle

Every implementation decision should support this sentence:

> DealLens helps users decide which discovered companies deserve attention, which data they can trust, and what they should research next.

If a feature does not support that sentence, do not build it.

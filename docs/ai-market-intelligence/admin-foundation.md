# Market Intelligence - Admin Foundation

## Overview

Market Intelligence is an admin-only MVP module for research project setup and scoped insights. It provides DCA OS Lite with a foundation for competitive analysis, market research, trend tracking, and admin-reviewed insights.

For the MVP contract, each research project should stay tenant-scoped and can optionally be linked to a client, project, and month so the work can be grouped with AI Delivery and monthly reporting without becoming client-visible by default.

## Closure Note

The admin MVP foundation is implemented and locally validated, including research inputs, internal handoff bridge, handoff isolation, AI Delivery project context integration, and Monthly Report MI context integration. Focused smoke coverage now includes the Monthly Report MI context lifecycle and Client Portal non-exposure guard. Client-visible Market Intelligence **client-safe summary** in Client Portal MVP is required for Puriva; raw MI internals and export handoff to clients remain admin-only.

## Purpose

Admins can use Market Intelligence to:

- Create and manage Research Projects
- Curate and track Research Sources
- Create bounded Research Runs
- Document and review Market Insights
- Track competitive trends and opportunities
- Package an internal research deliverable for AI Delivery or reporting handoff when needed

## MVP Scope

### Supported Objects

- **Research Project** - Top-level container for market research work
- **Research Source** - Curated reference materials, URLs, or notes
- **Research Run** - Bounded execution placeholder for research analysis
- **Market Insight** - Summary of findings, opportunities, or trends with admin review status

### MVP Workflow Contract

**Admin can create/run**

- create a research project
- attach client/project/month context when relevant
- add research inputs such as keywords, URLs, competitors, niche, and product/service focus
- run a bounded research execution
- review, revise, approve, and archive the resulting insight record

**Outputs**

- market summary
- competitor summary
- audience / audience-signal summary
- opportunities
- risks / threats
- recommended next actions
- source notes / evidence notes

**Internal vs deliverable**

- The curated summary set can become an internal deliverable for AI Delivery or monthly report handoff.
- Raw source lists, run metadata, and reviewer notes stay internal.
- Client Portal MVP requires client-safe MI summary visibility (Puriva); raw MI internals remain admin-only.

**Relationship to other modules**

- **AI Delivery** can consume the summary as an internal research input or handoff artifact.
- **AI SEO** can consume market findings as context for briefs, angles, and planning.
- **Monthly Reports** can reference the summary as internal evidence or supporting narrative, but the report layer stays separate.

### Key Features

- Admin-only CRUD for all objects
- Tenant-scoped access control (owner/admin roles only)
- Optional client/project/month linkage for organization and handoff
- Basic archiving for projects, sources, and insights
- Research run status tracking (PENDING, EXECUTED)
- Insight status workflow (DRAFT, NEEDS_REVISION, REVIEWED, APPROVED)
- Simple web-based UI with modals for create/edit

### Field Coverage

- Minimal practical fields per object
- No external API integrations
- No autonomous or background agents
- No finance/payment logic
- No Client Portal or public links
- No WordPress integration

## Usage

### Admin Workflow

1. **Create a Research Project** - Set a title, optional description, and status
2. **Add Research Sources** - Reference URLs, documents, or notes relevant to the project
3. **Create Research Runs** - Create a run placeholder (no external API calls at this stage)
4. **Record Market Insights** - Document findings, opportunities, or competitive signals with a draft/review/final status
5. **Archive as needed** - Archive projects, sources, or insights when no longer relevant

### API Endpoints

All endpoints require owner/admin roles and are tenant-scoped.

```
GET    /api/v1/market-intelligence-projects
POST   /api/v1/market-intelligence-projects
PUT    /api/v1/market-intelligence-projects/:id
POST   /api/v1/market-intelligence-projects/:id/archive

GET    /api/v1/market-intelligence-projects/:projectId/sources
POST   /api/v1/market-intelligence-projects/:projectId/sources
PUT    /api/v1/market-intelligence-projects/:projectId/sources/:sourceId
POST   /api/v1/market-intelligence-projects/:projectId/sources/:sourceId/archive

GET    /api/v1/market-intelligence-projects/:projectId/research-runs
POST   /api/v1/market-intelligence-projects/:projectId/research-runs
POST   /api/v1/market-intelligence-projects/:projectId/research-runs/:runId/execute

GET    /api/v1/market-intelligence-projects/:projectId/insights
POST   /api/v1/market-intelligence-projects/:projectId/insights
PUT    /api/v1/market-intelligence-projects/:projectId/insights/:insightId
POST   /api/v1/market-intelligence-projects/:projectId/insights/:insightId/archive
```

### AI Insight Workflow

Market Intelligence includes a bounded AI Insight workflow that allows an admin to generate structured insights from curated sources.

1. **Trigger:** The admin manually creates and executes a Research Run.
2. **Generation:** The execution aggregates the project sources and runs a bounded, deterministic local generation.
3. **Result Contract (MARKET_INTELLIGENCE_RESULT_V1):** The execution produces a structured JSON result including:
   - `summary`
   - `competitors`
   - `marketTrends`
   - `opportunities`
   - `threats`
   - `pricingSignals`
   - `contentOrSeoAngles`
   - `recommendedNextActions`
   - `sourceNotes`
   - `confidenceNotes`
4. **Persistence:** The structured result is safely stored in the Research Run's `executionLog` and `resultSummary`, and a linked Market Insight is automatically generated.
5. **Review Flow:** Admins can view the structured Insight in the UI and update its status through a simple dropdown (DRAFT, NEEDS_REVISION, REVIEWED, APPROVED).

### API / UI Sequence Proposal

1. Admin creates a Market Intelligence project.
2. Admin links optional client/project/month context.
3. Admin adds sources, keywords, competitor URLs, niche, and product/service focus.
4. Admin runs the research execution.
5. UI shows the structured summary and evidence notes.
6. Admin marks the result reviewed or approved.
7. Optional internal handoff can be used by AI Delivery or monthly reporting.

### Source Evidence and Traceability

Market Intelligence insights include source evidence context to support admin review and decision-making:

1. **Project-Level Sources:** All Research Sources belong to a Research Project. When a Research Run executes, it analyzes all active sources for that project.
2. **Source Count Display:** Insights and Research Runs display the number of sources that informed the analysis (e.g., "Based on 3 project sources").
3. **Run-to-Insight Linking:** When a Research Run executes successfully, it automatically creates a linked Market Insight. The UI indicates which insights were generated from runs.
4. **Review Context:** The structured insight result includes `sourceNotes` and `confidenceNotes` fields to help admins understand the evidence basis.
5. **No Deep Source Content Storage:** Sources store metadata (title, URL, notes) only. The system does not crawl, fetch, or store full source content in this MVP.

### Review Workflow

Insights support a simple admin review workflow with four statuses:

- **DRAFT** - Initial state; insight has not been reviewed
- **NEEDS_REVISION** - Admin marked the insight as requiring changes or updates
- **REVIEWED** - Admin has reviewed the insight and it appears accurate
- **APPROVED** - Admin has approved the insight for use in business decisions

Admins can also add **Reviewer Notes** when updating an insight's status to document their assessment or questions.

### Internal Handoff Bridge

Once an insight is APPROVED, the admin can prepare an internal handoff record that surfaces the insight's key content for use in delivery planning or reporting. This is strictly admin-internal and is never exposed to the Client Portal.

**Handoff content (derived deterministically from approved insight result):**
- `marketSummary` — top-level summary
- `competitorSummary` — condensed competitor list (up to 5)
- `audienceSignals` — target niche and keyword-informed audience signals
- `opportunities` — recommended opportunity signals
- `risks` — threat/risk signals
- `recommendedActions` — next actions from the insight
- `sourceNote` — evidence note from the insight result
- `targetClientName` / `targetMonth` — context from the project research inputs

**Handoff status lifecycle:**
- `DRAFT` → initial state after prepare
- `READY` → admin marked ready for use in delivery planning
- `APPLIED` → admin has applied the handoff to a delivery or report context
- `ARCHIVED` → soft-removed via archive action

**API endpoints:**
```
GET    /api/v1/market-intelligence-projects/:projectId/handoffs
POST   /api/v1/market-intelligence-projects/:projectId/handoffs/prepare
PUT    /api/v1/market-intelligence-projects/:projectId/handoffs/:handoffId/status
POST   /api/v1/market-intelligence-projects/:projectId/handoffs/:handoffId/archive
```

All handoff endpoints require owner/admin role and are tenant-scoped. Cross-project and cross-tenant isolation is enforced. Preparing a handoff from a non-APPROVED insight returns 400.



The system supports this traceability flow:

```
Research Sources (curated by admin)
  ↓
Research Run (executes bounded analysis)
  ↓
Market Insight (auto-generated with structured data)
  ↓
Admin Review (status + notes)
```

This allows admins to answer:
- Which sources informed this insight?
- Which research run generated it?
- What is the review status and any reviewer notes?
- Is this insight approved for business use?

### Database Schema

- `MarketIntelligenceProject` - project metadata, status, and research inputs (keywords, competitors, niche, productServiceFocus, **clientId required** — approved 2026-06-26; `targetClientName` legacy/deprecated)
- `MarketIntelligenceSource` - source references with URLs and notes
- `MarketIntelligenceResearchRun` - execution tracking with status and results
- `MarketIntelligenceInsight` - insight records with reviewer notes and status
- `MarketIntelligenceHandoff` - internal handoff bridge (admin-only, not client-facing); tenant/project/insight scoped with status lifecycle; optional `aiDeliveryProjectId` field links to an AI Delivery project as internal context

All tables are tenant-scoped and support archiving.

## AI Delivery Context Integration

An approved MI handoff (READY status) can be attached to an AI Delivery project as internal research context.

### Endpoints

- `GET /api/v1/ai-delivery/projects/:projectId/market-intelligence-context` — list applied handoffs (admin-only)
- `POST /api/v1/ai-delivery/projects/:projectId/market-intelligence-context/apply` — attach a READY handoff (body: `{ handoffId }`)
- `POST /api/v1/ai-delivery/projects/:projectId/market-intelligence-context/:handoffId/remove` — detach a handoff (reverts to READY)

### Rules

- Only READY or already-APPLIED handoffs can be linked. DRAFT and ARCHIVED handoffs are rejected (403).
- Removing a link reverts the handoff to READY and clears `aiDeliveryProjectId`.
- No client portal exposure. No public links. Admin-only internal context.
- Monthly reports can now store an admin-only MI context reference (`miHandoffId`) and editable internal context draft (`miContextDraft`) from an applied handoff. This is not exposed through the Client Portal monthly report select, and focused smoke coverage in `scripts/smoke-monthly-report-mi-context-local.mjs` verifies apply/get/update/remove lifecycle plus Client Portal non-exposure of internal MI fields/content.

## Deferred Features

**Do not implement unless explicitly approved:**

- Live crawling and scraping
- Autonomous or scheduled monitoring agents
- Raw MI internals, prompts, workflow runs, or full MI export to Client Portal (implement **client-safe MI summaries** for Client Portal MVP instead)
- Paid data providers / external market data APIs
- WordPress integration
- Export/reporting beyond internal handoff
- Real external credentials
- Brand-specific models
- Finance/payment logic

## G217–G218 shared contract alignment

Shared typed contracts (no live scrape / no uncontrolled source ingestion):

- Admin-reviewed source summary requires operator review and forbids uncontrolled scraping.
- Client-safe summary exposes only title, market summary, opportunities, recommended actions, status, and a non-live source label.
- Forbidden on client-safe payloads: `tenantId`, `storageKey`, `executionLog`, `reviewerNotes`, `resultData`, `sourceUrl`, `sourceNotes`, `confidenceNotes`, `provider`, `prompt`, `rawFindings`, `researchRunId`, `insightId`.

Proof coverage lives in `packages/shared/src/future-module-contracts.proof.ts`,
`apps/api/src/core/future-module-contracts.test.ts` (G601–G610), and Puriva unit tests.
This does **not** claim new live crawl, provider, or production readiness.

### G601–G604 truth labels

| Claim | Status |
|-------|--------|
| Bounded local sources only | True (contract-enforced) |
| Uncontrolled scraping / live crawl | False / disabled |
| Client-safe summary without admin review | Not allowed |
| Live Market Intelligence module readiness | Not claimed |

See `docs/runbooks/FUTURE_MODULES_G601_G612_CLOSEOUT.md`.

## Future Phases

Potential enhancements for future consideration:

- Admin dashboard with project metrics
- Bulk import of research sources
- Advanced filtering and search
- AI-powered insight summaries (with bounded, deterministic execution)
- Multi-project comparison views
- Audit logging for insight changes
- Expand Client Portal MVP for Puriva (client-safe MI summary, SEO, deliverables, publishing status — **required**)
- Export to WordPress / headless CMS

## Admin-Only MVP Principle

Market Intelligence is **admin-operated only** in this MVP:

- No autonomous agents that incur cost without explicit approval
- No background scheduling
- No external integrations without explicit configuration
- All research and insights are manually created and reviewed by admins
- Simple, bounded execution model
- Focus on usability for competitive analysis and trend tracking

## Next Steps

After MVP validation:

1. Gather admin feedback on workflow
2. Consider AI-powered insight generation (with safe, bounded execution model)
3. Evaluate external market data integrations
4. Expand Client Portal MVP for Puriva (client-safe MI summary, SEO, deliverables, publishing status — required)
5. Design export/reporting for insights

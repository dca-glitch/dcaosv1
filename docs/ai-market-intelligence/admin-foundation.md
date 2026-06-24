# Market Intelligence - Admin Foundation

## Overview

Market Intelligence is an admin-only MVP module for research project setup and scoped insights. It provides DCA OS Lite with a foundation for competitive analysis, market research, trend tracking, and admin-reviewed insights.

## Purpose

Admins can use Market Intelligence to:

- Create and manage Research Projects
- Curate and track Research Sources
- Create bounded Research Runs
- Document and review Market Insights
- Track competitive trends and opportunities

## MVP Scope

### Supported Objects

- **Research Project** - Top-level container for market research work
- **Research Source** - Curated reference materials, URLs, or notes
- **Research Run** - Bounded execution placeholder for research analysis
- **Market Insight** - Summary of findings, opportunities, or trends with admin review status

### Key Features

- Admin-only CRUD for all objects
- Tenant-scoped access control (owner/admin roles only)
- Basic archiving for projects, sources, and insights
- Research run status tracking (PENDING, EXECUTED)
- Insight status workflow (DRAFT, REVIEW, FINAL)
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

### Traceability Chain

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

- `MarketIntelligenceProject` - project metadata and status
- `MarketIntelligenceSource` - source references with URLs and notes
- `MarketIntelligenceResearchRun` - execution tracking with status and results
- `MarketIntelligenceInsight` - insight records with reviewer notes and status

All tables are tenant-scoped and support archiving.

## Deferred Features

**Do not implement unless explicitly approved:**

- Client Portal - Public client access to projects or insights
- External Market Data APIs - Real third-party market data integrations
- Autonomous Background Agents - Scheduled or autonomous research execution
- WordPress Integration - Publishing Market Intelligence to WordPress
- Export/Reporting - PDF, Google Docs, or other export formats
- Finance/Payment Logic - Subscription, pricing, or billing for insights
- Real External Credentials - No real API keys, secrets, or provider integrations
- Brand-Specific Models - Keep models generic for multi-tenant use

## Future Phases

Potential enhancements for future consideration:

- Admin dashboard with project metrics
- Bulk import of research sources
- Advanced filtering and search
- AI-powered insight summaries (with bounded, deterministic execution)
- Multi-project comparison views
- Audit logging for insight changes
- Client Portal foundation (separate module)
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
4. Plan Client Portal read-only access (future module)
5. Design export/reporting for insights

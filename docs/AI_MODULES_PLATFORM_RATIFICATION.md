# DCA OS Lite - Shared Platform and AI Modules Ratification

## Ratified Direction

DCA OS Lite should be built as a shared operating platform first, then extended through vertical modules.

The system must not be built as separate isolated workflows for each business use case. Shared layers must be created first so that AI Delivery, SEO, Content Production, Revenue Hub, Directory/Listings, Product/POD, Market Intelligence, Reporting, and Client Portal can reuse the same foundations.

## Current Stage

DCA OS Lite is currently in local-first admin/operator foundation work.

Completed AI Delivery foundation includes:

- AI Delivery projects.
- AI Delivery brief foundation.
- Workflow runs.
- Deliverables.
- Deliverable reviews.
- Deliverable export/download admin actions.
- Operator summary.
- AI SEO foundation UI.
- AI Content Production foundation UI.
- Local validation and AI Delivery regression smoke.
- Status documentation update.

Production remains frozen unless explicitly approved.

## Core Build Principle

Build order must prioritize shared engines before vertical modules.

Shared engines:

1. Core Platform Layer.
2. Events and Notifications Layer.
3. File / Asset / R2 Storage Layer.
4. Approval / Review / Deliverable Layer.
5. Client Portal Foundation.
6. AI Workflow Execution Layer.
7. Data Collection / Scraping Layer.
8. Revenue / Commerce Sync Layer.
9. Reporting Layer.

Vertical modules should be built after these shared layers are stable.

## Ratified Near-Term Order

1. EN2 event wiring.
2. UI/UX cleanup and Dark Nebula design system pass.
3. R2 asset and deliverable storage expansion.
4. Client Portal foundation.
5. AI Workflow real execution layer.
6. Data Collection / Scraping foundation.
7. AI SEO real workflow.
8. AI Content Production real workflow.
9. Revenue Hub generic connector foundation.
10. Reports Hub.
11. Directory / Listings engine.
12. Product / POD pipeline.
13. Market Intelligence layer.

## Revenue Hub Requirement

Revenue Hub must be generic and multi-source.

It must support:

- WordPress.
- WooCommerce.
- Stripe.
- Next.js websites.
- Custom websites.
- API-based integrations.
- Webhook-based integrations.
- Manual/import-based revenue data where needed.

Revenue Hub must not be limited to WordPress-only architecture.

## AI and Data Collection Requirement

AI research and scraping should be implemented as a shared Data Collection Engine, not as isolated module-specific scraping.

The Data Collection Engine should support:

- Directory page discovery.
- Business listing extraction.
- Competitor research.
- SEO source collection.
- Market research.
- Pricing/trend checks.
- Source deduplication.
- Admin review before use.
- Bounded crawling and safe execution limits.

Raw crawl logs, prompts, sources, and internal AI run details must remain admin/operator-only unless explicitly transformed into client-safe summaries.

## DCA/Admin Perspective

The system must help DCA:

- Manage clients, projects, work, deliverables, and approvals.
- Run AI-supported workflows under admin control.
- Store and export final deliverables.
- Produce reports.
- Publish or prepare approved content.
- Track revenue across multiple site and commerce sources.
- Reuse the same AI, storage, event, approval, and reporting foundations across all modules.

## Client Perspective

Clients should see only client-safe workflow outputs:

- Brief submission.
- Research summary.
- Monthly plan review.
- Article/content review.
- Image review.
- Approve / request changes.
- Final deliverables.
- Published links.
- PDF/report downloads.
- Historical archive.

Clients should not see:

- AI prompts.
- Raw crawl logs.
- Internal workflow runs.
- Technical statuses.
- Cost data.
- Provider details.
- Admin-only notes unless explicitly shared.

## Business Use Case Rule

Specific business use cases must be implemented through shared platform modules, not hard-coded as isolated systems.

A business use case may use:

- Core Platform.
- AI Workflow.
- Data Collection.
- Revenue Hub.
- Reports Hub.
- Client Portal.
- Asset Storage.
- Directory/Listings.
- Product/POD.
- Market Intelligence.

But the shared engines remain the system foundation.

## Current Scope Risk

Existing authenticated client-review routes/views are classified as paused foundation / scope-risk for the Client Portal block.

They should not be expanded during EN2.

They should be reviewed and either formalized, hidden, or rebuilt during the Client Portal foundation block.

## Ratified Constraint

Do not jump directly into large vertical modules before shared platform layers are stable.

The approved sequence is:

Shared platform foundations first.

Vertical modules second.

Business-specific workflows last.

# DCA OS Lite - Shared Platform and AI Modules Ratification

## Ratified Direction

DCA OS Lite should be built as a shared operating platform first, then extended through vertical modules.

The system must not be built as separate isolated workflows for each business use case. Shared layers must be created first so that AI Delivery, SEO, Content Production, Revenue Hub, Directory/Listings, Product/POD, Market Intelligence, Reporting, and Client Portal can reuse the same foundations.

## Current Stage

DCA OS Lite is currently in local-first admin/operator foundation work.

Current UI / route stabilization is complete on the Botanical Light baseline: full-system UI redesign, AI Delivery workspace sectioning, Workflow Briefs cleanup, client-facing polish, dashboard audit feed smoke alignment, and client-only `#/client-portal` access.

Current AI Delivery admin workflow foundation order:

1. Project + brief.
2. Workflow runs.
3. Research / Sources.
4. AI SEO / Content Plan.
5. AI Content Production.
6. Image Production Planning.
7. Deliverables.
8. Deliverable reviews.
9. Operator summary and project-card workflow navigation.
10. Focused AI Delivery smoke coverage.

Readiness framing:

- Admin/operator foundation: mostly ready.
- July-ready internal MVP: partial.
- Full client-facing module: not complete.
- Full AI modules roadmap: still early stage.

Locally proven admin/operator foundation:

- `npm.cmd run validate` has passed on the current branch foundations.
- `npm.cmd run smoke:local` has passed as the local gate for completed implementation slices.
- The focused AI Delivery smoke has been hardened for repeated local regression work.
- AI SEO admin workflow shell/status summary is in place and smoke-covered as part of the AI Delivery workflow shell.
- Focused smoke fixture isolation now uses dedicated smoke-owned AI Delivery projects instead of mutating arbitrary local dev projects.
- EN2 now has a schema-free platform AuditLog writer foundation for logout, tenant switch, tenant settings update, and module enable/disable actions.
- Local proof confirmed a reversible module enable/disable action created a `module.enabled` `AuditLog` row with tenant, actor, entity, and metadata context and no `EmailLog` side effects.
- No deploy has been performed. Production remains frozen unless explicitly approved.

Still intentionally not active:

- Client review/actions and future client delivery expansion. The read-only Client Portal archive and FINAL-only monthly reports archive are implemented where documented.
- real provider email sending from EN2/event wiring.
- Live AI calls.
- Crawling or research ingestion.
- Broader export automation, production rollout, and future export variants beyond the implemented AI Delivery Google Docs/export foundation and Monthly Report PDF/document handoff.
- Publishing connectors such as WordPress, Next.js/custom React, or headless CMS.
- Google OAuth / live GSC sync and client-facing metrics exposure.
- Admin-operated normalized GA/GSC monthly metric snapshots are closed.
- Live GA/GSC provider sync/OAuth and client-facing metrics reporting remain not active.
- Future automated or broader report generation beyond the implemented Monthly Report persisted/admin/client FINAL-only/PDF/document handoff foundation.
- Production deploy/hardening.

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
2. UI/UX cleanup and Botanical Light design system pass.
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

The next planning block is AI SEO / AI Delivery Planning; keep the work incremental and avoid broad refactors.

## Next Safe Implementation Guidance

Keep the next implementation blocks sealed and layer-specific:

1. Docs-only, UI-only, smoke-only, and API-only blocks may be combined only when the scope remains reviewable and runtime-safe.
2. Do not combine schema + API + UI in one block unless explicitly approved.
3. Do not activate Client Portal, provider sending, queues, or broader EN2/email delivery wiring unless explicitly selected.
4. Do not deploy without separate approval.
5. Preserve the current platform-neutral AI Delivery model so future delivery/export adapters can target WordPress, Next.js/custom React, headless CMS, Markdown/MDX, JSON packages, Google Docs, and PDF without changing the core admin workflow records.

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
- Publish or prepare approved content through future connector adapters.
- Track revenue across multiple site and commerce sources.
- Reuse the same AI, storage, event, approval, and reporting foundations across all modules.

For AI Delivery specifically, the shared delivery layer should stay platform-neutral so that the same approved content draft, article image, and deliverable package records can later target:

- WordPress.
- Next.js/custom React.
- Headless CMS.
- Markdown/MDX.
- JSON packages.
- Google Docs.
- PDF.

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

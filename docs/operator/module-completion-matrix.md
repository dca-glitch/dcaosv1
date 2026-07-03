# Module Completion Matrix

Status: Plain-language module status for planning and admin understanding.

This matrix explains what is usable now, what is partial, and what is waiting for later.

## Status Labels

- Closed for MVP: usable for the current local/admin MVP.
- Partial: useful foundation exists, but important pieces are still missing.
- Deferred: intentionally not active yet.
- Future: planned later, not current priority.

## Summary Matrix

| Area | Current Status | Plain-language meaning |
| --- | --- | --- |
| Core login and tenant context | Closed for MVP | Admin can log in locally, work inside a tenant, and use owner/admin areas. |
| Clients | Closed for MVP | Admin can manage client records and connect client-level access. |
| Client Portal | Closed for MVP (local) — UX polish in Phase F Block 68 | **Client Portal MVP is required for Puriva** — client-safe visibility path is complete locally (Blocks 7–30). Advanced portal features (magic links, full comment threads) remain deferred Phase 2. Clients must not see raw prompts, workflow runs, AI costs, credentials, or admin-only notes. |
| Projects | Closed for MVP | Admin can organize work by project, including monthly client projects. |
| Tasks | Closed for MVP | Admin can track operational work and reminders. |
| AI Delivery | Closed for local/admin MVP | Admin can run the main delivery workflow for briefs, plans, drafts, deliverables, exports, and reports. |
| WorkflowBriefs | Closed for local/admin MVP — client-safe boundary hardened (Blocks 4D–4G, 4G-FIX) | Composable brief intake / context-composition / production-automation layer that writes into AiDelivery's shared production tables; confirmed active, not legacy. Client-facing surface labeled "Production Plan Review". See [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](../modules/WORKFLOW_BRIEFS_MODULE_PLAN.md). |
| AI SEO | Closed for admin-operated MVP shell | Admin can use SEO planning and content workflow foundations, including content-plan PDF export/private storage with stale-PDF invalidation (Blocks 3B–3G). Live Google integrations are deferred. |
| AI Content Production | Closed for admin-operated MVP shell | Admin can prepare and review content drafts and delivery handoff. |
| AI Knowledge / Context layer | Closed for admin-only MVP (Block 5A reviewed, no code change needed) | Admin-only, route-hard-gated reusable memory (`AiKnowledgeItem`/`AiContextSnapshot`) feeding AiDelivery workflow-run context; confirmed no client-reachable exposure. Not yet integrated into WorkflowBriefs' own AI-run pipeline — see deferred scope register. |
| Market Intelligence | Closed for local/admin MVP — compact pass in Phase F Block 67 | Admin can prepare market context and handoff to AI Delivery; deeper automation remains later. |
| Monthly Reports | Closed for admin/client-safe archive path | Admin can prepare reports and expose final reports safely to the client archive. |
| Finance | Closed for local/admin MVP | Invoices, bills, vendors, services, and credit notes have useful admin foundations. |
| R2/private storage | Partial (65% in scope) | Local/admin private upload/download proof exists; production switch needs separate approval. |
| Email notifications | Partial foundation | Backend foundation exists, but real sending and queues remain inactive. |
| AI provider execution | Partial guarded foundation | Local deterministic execution is safest; live provider use needs explicit configuration and approval. |
| Revenue Hub AI | Future | Planned later after shared foundations are stable. |
| POD AI Toolkit | Future | Planned later after shared foundations are stable. |
| Data collection / scraping | Future / deferred | Broad scraping and autonomous crawling are not active. |
| Confirmed staging target | Closed (G1) | G1 approved: `staging.digitalcubeagency.net`; production `system.digitalcubeagency.net`; same VPS, separate stack; DNS not created; G4 not approved. |
| Production deployment | Deferred | PR #13 is merged to `main`, but current `main` is 0% deployed to production. VPS/production remains frozen until separate approval. |

## Core Platform

Current status: Closed for MVP.

The core platform supports local login, tenant context, module visibility, admin access, dashboard basics, settings summary, and team summary.

Still later:

- invite flow;
- password reset;
- role editing UI;
- deeper audit dashboards;
- production hardening.

## Client Work

Current status: Closed for local/admin MVP with read-only client archive.

Admin can prepare client work and keep final deliverables organized.

Client access exists at client level, not project level.

Still later:

- project-specific grants;
- client approvals;
- client comments;
- public approval links;
- client request-changes workflows.

## AI Delivery

Current status: Closed for local/admin MVP.

AI Delivery is the main operating path for monthly content work.

It supports:

- project and brief foundation;
- workflow runs;
- research requests and summaries;
- content plans;
- draft generation handoff;
- image planning/final image handling;
- deliverable packaging;
- export/download handoff;
- WordPress draft preparation handoff;
- monthly report integration.

Still later:

- production provider proof;
- autonomous agents;
- client-side approval workflows;
- live publishing automation.

## AI SEO

Current status: Admin-operated MVP shell.

AI SEO supports planning and content workflow structure.

Still later:

- live Google Search Console sync;
- Google OAuth;
- client-facing metrics exposure;
- advanced SEO automation;
- automated content-plan exports.

## Market Intelligence

Current status: Admin MVP foundation.

The system can prepare useful market context and attach approved handoff context to AI Delivery.

Still later:

- richer competitor monitoring;
- recurring research;
- broader scraping;
- deeper client-facing market reports;
- automatic source discovery with stronger review tools.

## Monthly Reports

Current status: Closed for admin/client-safe archive path.

Monthly reports can summarize final client work and be exposed as final client-safe material.

Still later:

- live analytics sync;
- deeper trend automation;
- client-facing interactive dashboards;
- automatic provider data refresh.

## Finance

Current status: Closed for local/admin MVP.

Finance supports practical admin records for invoices, bills, vendors, credit notes, and services.

Still later:

- live payment collection;
- accounting integrations;
- bank feeds;
- tax filing automation;
- legacy finance migration.

## UI / Design System

Current status: Data-dense admin UI phase 1/2 closed.

The admin interface direction is now operator-focused: compact rows, calm buttons, status chips, and fewer visible actions per record.

Still later:

- Market Intelligence compact pass;
- Monthly Reports compact pass;
- Client Portal shell review;
- Settings/Team/Company Profile polish;
- modal internals.

## Recommended Next Focus

For client delivery readiness, **MVP 1 Puriva client delivery** is locally merged and validated per [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](../architecture/CLIENT_DOMAIN_OPERATING_MODEL.md). Next focus should not imply production deployment:

1. Client Portal MVP visibility and human/client review for Puriva;
2. admin operator path (AI Delivery, MI, publishing handoff);
3. client delivery SOP;
4. pre-production readiness checklist;
5. G2/G3 local closeout, then G4 VPS staging execution only after separate owner approval — staging host is `staging.digitalcubeagency.net` (DNS not created yet).

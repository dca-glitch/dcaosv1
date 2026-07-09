# Architecture

## Product

DCA OS Lite is an **internal agency operating system first**; a SaaS-like licensee product is a later track — not the current readiness claim.

It is a reusable platform foundation for agency operations: client-facing portals, dashboards, automations, finance modules, SEO modules, AI modules, and reporting modules.

**Approved product disposition (G52-B, 2026-07-09):** [`docs/architecture/G52_OWNER_DISPOSITION.md`](./architecture/G52_OWNER_DISPOSITION.md).
**Production readiness:** **NO** — see [`docs/STATUS.md`](./STATUS.md).

## Architecture Layers

### Platform layers (generic)

1. Core platform
2. Authentication and session layer
3. Tenant and company layer
4. Role and permission layer
5. Module registry and entitlement layer
6. Settings layer
7. Audit and activity layer
8. Reusable module framework
9. Business modules (generic)
10. AI and automation modules (generic)

### Client delivery layers (configuration, not forks)

Approved stack (G52-B):

```text
DCA OS Core → Generic Modules → Workflow Templates → Module Entitlements
  → Compliance / Content / Image Profiles → Client Operating Packs → Client-safe Portal Surfaces
```

- **Core and modules stay generic.** Client-specific behavior belongs in profiles, workflow templates, entitlements, and Client Operating Packs — not Core forks.
- **Puriva** (`puriva.id`) is the **first Client Operating Pack** — not a fork and not an architecture mistake.

Canonical docs: [`docs/architecture/CLIENT_OPERATING_PACKS.md`](./architecture/CLIENT_OPERATING_PACKS.md), [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](./architecture/PURIVA_OPERATING_PACK_V1.md).

## Workspace Layout

apps/api contains the backend API.
apps/web contains the frontend app.
packages/shared contains shared TypeScript contracts.
packages/data contains Prisma schema and database-related tooling.

## Backend Direction

The API is organized around a versioned boundary. The current boundary is /api/v1.

Backend modules should follow this pattern:

- route
- controller
- service
- shared contract
- validation layer later
- repository/data layer later

The API should return consistent response shapes and use central error handling.

## Frontend Direction

The frontend is a React and Vite application.

Frontend modules should follow reusable page patterns:

- module shell
- list page
- detail page
- form page
- dashboard card
- loading state
- empty state
- error state

## Shared Package Direction

The shared package is the contract boundary between frontend and backend.

It should include:

- API response contracts
- module contracts
- navigation contracts
- permission keys
- dashboard card contracts
- CRUD/list/detail/form contracts

## Data Package Direction

The data package owns Prisma schema and database tooling.

It should not become a dumping ground for business logic. Business rules belong in API services or dedicated domain modules.

## Module System Direction

Every feature should be treated as a module with metadata.

A module may define:

- key
- name
- description
- routes
- navigation entries
- permissions
- dashboard cards
- entitlement requirements

## Future Runtime Flow

A request should eventually resolve:

1. user session
2. tenant context
3. tenant membership
4. role assignments
5. permission grants
6. module entitlement
7. requested operation

## Design Principle

Build reusable platform foundations first. Add business modules only after platform gates are stable.

## Client / Domain Operating Model (approved 2026-06-26; G52-B alignment 2026-07-09)

Canonical architecture for how internet domains connect to the platform core:

- **Each domain = one `Client` record** (no separate `DomainProperty` entity).
- **Tenant** = workspace / licensee (e.g. Digital Cube Agency LLC today; independent companies as future licensee tenants).
- **`clientKind`:** `AGENCY_CLIENT` (agency SEO/content clients) \| `OWN_DOMAIN` (own portfolio domains; each maps to an independent legal entity).
- **Publication:** multiple `PublicationTarget` per Client (WordPress per subdomain); credentials encrypted per target — not per tenant.
- **Finance:** agency client invoices in DCA LLC tenant only; own-domain finance in licensee tenants.
- **Client Portal:** `client` role + `ClientUserAccess` per Client (not per project).

Full specification: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

**Client Operating Packs** configure delivery behavior per client (profiles, templates, entitlements) — see [`docs/architecture/CLIENT_OPERATING_PACKS.md`](./architecture/CLIENT_OPERATING_PACKS.md). Puriva is the first pack.

**Gate separation:** DCA OS Production v1 Gate (platform deploy safety) is separate from Puriva Client-Service Launch Gate (client delivery live proofs). See [`docs/architecture/G52_OWNER_DISPOSITION.md`](./architecture/G52_OWNER_DISPOSITION.md).

Approved implementation blocks 1–6 are listed in [`docs/ROADMAP.md`](./ROADMAP.md).

## Current application map (2026-07-04)

**Status reference:** [`docs/STATUS.md`](./STATUS.md). **Operator procedures:** [`docs/operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md).

### apps/api

Node.js + Express backend. Versioned boundary: `/api/v1`.

| Layer | Responsibility |
|-------|----------------|
| Routes | HTTP entry; auth/tenant/module middleware |
| Controllers | Request/response wiring |
| Services / runtime | Business logic (`*.runtime.ts`, `*.service.ts`) |
| Config | Env-driven feature gates (`auth.config`, `ai-provider.config`, `wordpress-integration.config`, `ga-gsc.config`) |
| Middlewares | Auth, authorization, tenant, rate limit, security headers |

Key runtime areas:

- **Auth/session** — login, logout, tenant switch, RBAC
- **AI Delivery** — projects, briefs, workflow runs, deliverables, reviews, export
- **Workflow Briefs** — MI/SEO runs, production plan, drafts, release package (writes into shared AI Delivery tables)
- **Market Intelligence** — findings, summaries, handoffs, delivery integration
- **Monthly Reports** — admin CRUD, PDF, metrics snapshots, MI context
- **Client Portal** — read-only client-safe archive APIs; approval editor session
- **Finance** — ledger, invoices, attribution (Finance Lite)
- **External integrations readiness** (Block 1) — `external-integrations-readiness.service.ts`; config shape only; `GET /integrations/readiness`
- **Admin operations** (Block 2) — `admin-operations-summary.service.ts`; `GET /admin/operations/summary`; DB probe + recovery hints

Default AI execution: **local deterministic**. OpenRouter is opt-in via env; not production-proven by default.

### apps/web

React + Vite frontend. Hash-based routing (`#/…`). Dark Nebula product UI direction.

| Area | Routes / surfaces |
|------|-------------------|
| Admin shell | Dashboard, Clients, Projects, AI Delivery, Workflow Briefs, Market Intelligence, Monthly Reports, Finance, Settings |
| Client shell | `#/client-portal`, `#/monthly-reports` (alias), pending approvals, legacy briefs intake |
| Block 2 | Dashboard → Operational readiness panel |
| Block 3 | Compact density pass in `styles.css` — admin and client surfaces |

**Boundary:** Client-only users blocked from admin routes. Client APIs sanitized (no `storageKey`, workflow internals, MI drafts, provider metadata).

### packages/data (Prisma)

PostgreSQL via Prisma. Schema in `packages/data/prisma/schema.prisma`. Migrations in `packages/data/prisma/migrations/`.

- Owns database schema and `prisma:generate`
- API accesses data through controlled boundaries — not direct Prisma in routes
- Tenant-scoped models; `ClientUserAccess` for client-level portal grants

### packages/shared

Shared TypeScript contracts between frontend and backend: API response shapes, permission keys, module contracts, navigation contracts.

### Admin / client boundaries

| Concern | Admin | Client |
|---------|-------|--------|
| AI workflow runs, prompts, costs | Yes | No |
| MI findings, drafts, handoffs | Yes | No (final summaries only where explicitly client-safe) |
| Content plans / drafts (phased review) | Yes | Approval editor for sent deliverables; plan/draft review routes return `CLIENT_REVIEW_DEFERRED` |
| Monthly reports | Full CRUD | FINAL status only in portal |
| WordPress | Draft prep, publish gate (disabled default) | No handoff controls |
| Integrations readiness | `GET /integrations/readiness` | Forbidden |
| Operations summary | `GET /admin/operations/summary` | Forbidden |

Canonical model: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

### AI Delivery workflow

Deterministic local-first chain: project → brief → workflow run → content plan → drafts → images → deliverables → review → export / WordPress draft prep.

- AI Gateway v1: guarded provider config, knowledge context, execution metadata
- AI Operations Console: admin read-only workflow run review
- Workflow Briefs: parallel intake/automation layer writing into shared production tables
- Knowledge layer: `AiKnowledgeItem` / `AiContextSnapshot`; approved items only; prompt-injection sanitization

### Market Intelligence

Admin-only MVP: research inputs → findings → deterministic summaries (`MI_SUMMARY_V1`) → handoffs → apply to AI Delivery / monthly reports. No client portal MI exposure. Live AI, scraping, autonomous agents deferred.

### Monthly Reports

Admin lifecycle: create/edit → metrics snapshot → MI context (internal) → PDF generation → FINAL status → client portal archive (FINAL only). Live GA/GSC sync deferred; snapshot-first metrics.

### Private storage / R2

Cloudflare R2 for private assets (PDFs, deliverables). Guarded when `R2_*` env absent (`R2_STORAGE_NOT_CONFIGURED`). Admin upload/download; clients receive signed/reference URLs without raw `storageKey`. Strict real-bucket proof deferred without explicit env.

### WordPress draft safety

- `WORDPRESS_PUBLISH_ENABLED` default false
- Draft preparation validates slug/title/target; publish gate metadata on prepared drafts
- `CREDENTIAL_ENCRYPTION_MASTER_KEY` required before encrypted publication targets
- No auto-publish; no client-triggered publish
- Live publish proof deferred

### External integrations readiness layer (Block 1)

Read-only config inspection for: AI provider (OpenRouter shape), WordPress publish gate, R2 env presence, GA/GSC OAuth shape. No live HTTP, OAuth, publish, sync, or bucket IO.

### Admin operations / recovery surface (Block 2)

Read-only aggregate: DB connectivity, integration readiness categories, recent operational audit events, static recovery hints, manual closeout command list. No durable smoke PASS store.

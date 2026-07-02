# DCA OS Roadmap

## MVP 1 — Puriva Client Delivery (2026-06-27)

**Status:** Owner-approved current priority. Full spec: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

**Active client:** `puriva.id` (agency client under DCA LLC tenant).

**Production system:** `system.digitalcubeagency.net` — final DCA OS login and application location.

Post-merge deployment note: PR #43 is merged into `main` and local `main` is synced to `origin/main`, but current `main` is **0% deployed** to production. **Production:** `system.digitalcubeagency.net`. **Staging (G1 approved):** `staging.digitalcubeagency.net` — same VPS, separate stack; DNS not created yet; G4 not approved.

Implementation priority (delivery path first):

1. Client Access Admin UI
2. Client Portal MVP (required — not deferred; Puriva agreement active)
3. Market Intelligence client-safe summary
4. AI SEO delivery flow
5. Google Docs deliverables
6. Website publishing workflow
7. Product catalog + inquiry for Puriva (inquiry only — no cart/checkout)
8. Monthly report final client view
9. Architecture blocks 1–6 (below)
10. Future domain modules — explicit scope only

Current UI / route stabilization is complete:

- Dark Nebula full-system UI pass
- AI Delivery workspace sectioning
- Workflow Briefs detail UI cleanup
- client-facing Dark Nebula polish
- dashboard audit feed smoke alignment
- client-only access to `#/client-portal`

The next recommended block after this docs refresh is **AI SEO / AI Delivery Planning**.

**Puriva MVP excludes:** `shop.puriva.id` ecommerce, Spa Finance, full Revenue Hub, full Commerce Core.

---

## Phase F — Local Completion (Blocks 58–77)

**Status:** Active local closeout after Post-MVP Blocks 31–57.

**Documentation:** [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md)  
**Index:** [`docs/runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md`](./runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md)

Continues local operator polish, guarded integration runbooks, and validation without VPS/staging/production deploy.

---

## Phase G — Post-Deferred / Staging & Owner Gates

**Status:** Block G1 closed (2026-06-27). Staging host: `staging.digitalcubeagency.net`. **G4 not approved.** Current: G2/G3.

**Documentation:** [`docs/ROADMAP_POST_DEFERRED_PHASE_G.md`](./ROADMAP_POST_DEFERRED_PHASE_G.md)  
**Index:** [`docs/runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md`](./runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md)  
**Block G1:** [`docs/runbooks/PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md`](./runbooks/PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md)  
**Owner template:** [`docs/operator/staging-target-decision-template.md`](./operator/staging-target-decision-template.md)

Prerequisite: Phase F merged to `main`. No VPS/production actions until Block G4 with separate owner approval.

---

## Approved Architecture Roadmap (2026-06-26)

**Status:** Owner-approved. Documentation: [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

Implementation order (each block: inspect → implement → validate → owner approval → commit):

| Block | Name | Layer order | Notes |
|-------|------|-------------|-------|
| **1** | Client foundation + `clientKind` | schema (approved) → backend → frontend | `AGENCY_CLIENT` / `OWN_DOMAIN`, `legalEntityName`, Client Hub shell |
| **2** | PublicationTarget (public) | schema → backend → frontend | Multiple WordPress targets per Client; deprecate tenant WP config |
| **3** | MI → `clientId` | schema → backend → frontend | Required FK; handoff validation |
| **4** | Encrypted credentials | design → schema → backend | Per PublicationTarget; security review gate |
| **5** | Real WordPress publish + PublicationLog | backend → frontend | After block 4 |
| **6** | Module middleware | backend | `requireTenantModule`; dry-run → enforce |

**Future block:** Licensee tenant migration (`OWN_DOMAIN` → independent company tenant + Finance).

**Not in these blocks:** Revenue Hub, Commerce Core, production deploy, live GA/GSC sync.

---

## Current Status

DCA OS v1 has a clean reusable foundation, dependency lockfile, real validation, CI, dependency monitoring, and project context documentation.

### Current Snapshot (after foundation hardening)

- **Finance foundation**: Active (Invoices, Bills, CreditNotes, InvoiceItems implemented)
- **AI Delivery admin foundation**: Active/local/admin-only (Project, Brief, Workflow, Deliverable, Review — bounded deterministic workflow, no live provider execution)
- **Market Intelligence admin foundation**: Closed/validated local/admin-only (Research, Insight — bounded analysis, tenant/project-isolated, smoke validated)
- **Feature branch CI validation**: Active (pushes to feature/* branches now validate; feature-branch feedback immediate)
- **GitHub Actions runtime**: Updated to latest versions; Node 20 deprecation warnings removed
- **API security headers + rate limiting**: Active (headers/CSP baseline and in-memory MVP rate limiting are in place)
- **Frontend auth token storage**: Aligned to sessionStorage for Market Intelligence
- **R2/private storage foundation**: Exists (docs/deployment planned; no implementation)
- **Audit/Activity foundation**: Exists (schema, local smoke; admin logging incomplete)
- **Backup/restore + staging migration runbooks**: Added
- **Finance tenant isolation smoke**: Local spoof handling is proven; full cross-tenant proof still needs a real second tenant fixture
- **Client Portal MVP**: Required now for Puriva client delivery (active agreement); client-safe visibility only — see MVP 1 section above
- **PR #13 / local proof**: PR #13 merged to `main`; local validation passed; local pre-staging proof accepted after isolated Finance browser smoke passed following local admin restore and API/Web restart
- **Staging target**: G1 closed — `staging.digitalcubeagency.net` (production remains `system.digitalcubeagency.net`; DNS not created; G4 not approved)
- **Production deployment**: Current `main` is not deployed; production remains frozen unless explicitly approved by owner

## Completed

- Block 0: repository initialization and identity verification
- Blocks 1-10: initial SaaS foundation
- Block 11: dependencies and real validation
- Block 12: CI validation and dependency monitoring foundation

## Next Controlled Blocks

### Block 13 — CI Result Review and Repair

Goal: confirm GitHub Actions CI passes and repair workflow/code only if CI fails.

Allowed:

- inspect CI result
- fix CI-only issues
- fix small validation errors

Not allowed:

- no migrations
- no database connection
- no deployment
- no feature work

### Block 14 — Targeted Dependency Audit Review

Goal: inspect the npm audit findings and decide safe targeted upgrades.

Allowed:

- run `npm audit`
- inspect vulnerability path
- propose targeted upgrade plan
- apply only safe patch/minor updates if clearly isolated

Not allowed:

- no `npm audit fix --force`
- no broad dependency replacement
- no package manager switch

### Block 15 — Local PostgreSQL Planning

Goal: plan local PostgreSQL setup without applying migrations.

Deliverables:

- Docker Compose plan
- database names
- user names
- shadow database plan
- `.env.example` only

Not allowed:

- no database connection from app
- no migrations
- no seeds

### Block 16 — Prisma Client Strategy

Goal: define controlled Prisma Client installation/generation strategy.

Deliverables:

- package boundary decision
- generated client location decision
- scripts plan
- validation approach

Not allowed:

- no migrations unless separately approved
- no application DB integration yet

### Block 17 — Database Access Layer

Goal: add a safe backend data access abstraction after Prisma Client strategy is approved.

Deliverables:

- database client module
- repository/service boundary
- error normalization
- no feature persistence yet unless approved

Required sequence before implementation:

1. Human Owner approves local DB start.
2. Start local PostgreSQL.
3. Confirm local DB health.
4. Human Owner approves first local migration.
5. Run migration.
6. Review generated migration.
7. Human Owner approves seed/bootstrap.
8. Run seed/bootstrap.
9. Create data access runtime boundary.
10. Resume real auth runtime.

Not allowed:

- no runtime DB wiring before the gate sequence is complete
- no auth runtime before the gate sequence is complete

### Block 18 — Auth Planning

Goal: design auth before implementation.

Deliverables:

- controlled login model
- session model
- password hashing strategy
- cookie/session security rules
- tenant membership resolution
- permission evaluation model
- password reset and lockout plan

Not allowed:

- no auth runtime before database runtime readiness is approved

### Block 19 — Auth Implementation MVP

Goal: implement controlled local auth MVP.

Scope depends on Block 18 approval.

### Block 19A — Auth Runtime Preparation

Goal: prepare auth runtime boundaries, constants, and validation guards without implementing login behavior.

Deliverables:

- runtime env naming
- route and audit constants
- skeleton validation guard updates
- prep documentation

Not allowed:

- no real login
- no cookie/session runtime
- no DB access runtime
- no password hashing runtime

### Block 19B — Auth Implementation Preflight Gate

Goal: document the auth runtime boundary before real implementation.

Deliverables:

- auth implementation preflight gate doc
- completed skeleton and boundary summary
- next-gate recommendation

Not allowed:

- no login/logout/me/change-password runtime
- no DB-backed session persistence
- no DB lookup work

### Block 19C-Lite — Permission Resolver Skeleton

Goal: add a fail-closed permission resolver boundary without RBAC runtime.

Deliverables:

- permission resolver skeleton
- checker update for skeleton-only behavior

Not allowed:

- no RBAC lookup
- no permission enforcement
- no route protection wiring

### Block 19C-Full — Module Access Resolver Skeleton

Goal: add a fail-closed module access resolver boundary without entitlement runtime.

Deliverables:

- module access resolver skeleton
- checker update for skeleton-only behavior

Not allowed:

- no module entitlement lookup
- no access enforcement
- no route protection wiring

### Block 19D-Lite — Auth Context Summary

Goal: document the auth-context and tenant-resolution boundary already in place.

Deliverables:

- auth context skeleton doc
- tenant resolver skeleton doc

Not allowed:

- no middleware wiring into active routes

### Block 19E-Lite — Runtime Plan Update

Goal: keep the runtime implementation plan aligned with the latest skeleton boundaries.

Deliverables:

- runtime plan doc refresh

Not allowed:

- no runtime auth implementation

### Block 19F-Lite — Security Baseline Update

Goal: keep the security baseline aligned with the auth skeleton boundary.

Deliverables:

- security baseline doc refresh

Not allowed:

- no runtime auth implementation

### Block 19G-Lite — Checker Hardening

Goal: extend auth skeleton validation to include the new resolver boundaries.

Deliverables:

- `check-auth-skeleton.mjs` update

Not allowed:

- no brittle runtime assumptions

### Block 19H-Lite — Preflight Gate Closeout

Goal: summarize the current auth implementation state before real runtime work.

Deliverables:

- gate summary doc

Not allowed:

- no runtime auth implementation

### Block 20 — Tenant Context Foundation

Goal: every API request can resolve tenant context safely.

Deliverables:

- auth context middleware skeleton
- tenant access resolver skeleton
- fail-closed protected request flow

Not allowed:

- no DB tenant lookup
- no permission resolution
- no module entitlement resolution
- no active route protection yet

### Block 21 — Users Module MVP

Goal: implement reusable users module using approved auth and tenant context.

### Block 22 — Roles and Permissions MVP

Goal: implement reusable role/permission foundation.

### Block 23 — Module Registry MVP

Goal: implement runtime module registry and tenant module entitlement checks.

### Block 24 — Settings MVP

Goal: implement platform and tenant settings foundation.

### Block 25 — Audit/Activity MVP

Goal: record important user/system events.

### Block 26 — Dashboard MVP

Goal: render tenant-aware dashboard cards from module registry.

### Block 27 — Projects Module MVP

Goal: first reusable business module after platform foundation.

## Release Gates

### Foundation Gate

Required before DB/auth work:

- CI passing
- dependency audit reviewed
- validation scripts stable
- project context docs updated

### Database Gate

Required before first migration:

- PostgreSQL setup approved
- Prisma Client strategy approved
- schema reviewed
- rollback plan documented

### Auth Gate

Required before auth implementation:

- controlled login model approved
- session model approved
- password hashing approved
- cookie strategy approved
- tenant membership rules approved
- permission rules approved

### Deployment Gate

Required before VPS deployment:

- local validation passing
- environment variable map complete
- database backup/rollback plan
- Caddy/domain plan
- deployment checklist

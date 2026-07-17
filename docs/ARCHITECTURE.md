# Architecture

## Product

DCA OS v2 is a private Agency Operations System for one organization: Digital Cube Agency. Public signup, self-service tenant creation, tenant-admin provisioning, subscriptions, marketplace, public sale/licensing, and future independent licensee tenants are not product direction.

Current canonical baseline is merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`). Production readiness remains **NO** for new work unless a current runbook explicitly authorizes it.

## Platform layout

| Workspace | Responsibility |
|---|---|
| `apps/web` | React + Vite frontend |
| `apps/api` | Node.js + Express API |
| `packages/data` | Prisma schema, migrations, and data tooling |
| `packages/shared` | Shared TypeScript contracts |

## Core architecture principles

- Core platform and modules stay generic.
- Client-specific behavior belongs in Client Operating Packs, workflow templates, module entitlements, and approved profile/config layers.
- `Workspace` is the approved primary boundary for data, authorization, reporting, costs, integrations, materials, and search. It supports `INTERNAL_BRAND` and `EXTERNAL_CLIENT` types.
- Current `Tenant`/`Client` code is legacy compatibility context during the phased, non-destructive migration; it is not the future product model.
- One internet domain maps to one `Client`.
- Client access is granted per `Client`, not per project.
- WordPress is an optional publishing connector, not the core content model.

## Current application map

### `apps/api`

- Versioned HTTP boundary at `/api/v1`
- Route → controller → runtime/service organization
- Central auth, tenant, role, and security middleware
- Default-safe AI path remains local deterministic unless a separate gate authorizes live provider use

Current runtime areas:

- auth/session/RBAC
- clients, projects, tasks
- AI Delivery
- Workflow Briefs
- Market Intelligence
- monthly reports
- Client Portal APIs
- Finance Lite
- integrations readiness / operator diagnostics

### `apps/web`

React + Vite frontend with hash routing.

Current UI baseline after `PR #55`:

- complex workflows moved to routed pages where that improved clarity
- short confirmation and single-purpose overlays may remain modals
- Botanical Light is the active design authority
- admin/operator surfaces prefer compact density
- client-facing surfaces prefer comfortable density

### `packages/data`

- Owns Prisma schema and migrations
- Current Tenant-scoped data model with `ClientUserAccess` for client portal grants; Phase 1 will add an expand-only Workspace foundation before any data backfill or endpoint switch
- Publication targets belong to `Client`, not tenant-global WordPress config

### `packages/shared`

- Shared API contracts
- navigation contracts
- permission keys
- reusable frontend/backend type boundary

## Boundaries that matter now

| Concern | Current rule |
|---|---|
| Client safety | No prompts, provider internals, raw workflow runs, AI cost details, credentials, or `storageKey` in client surfaces |
| Monthly reports | Client sees FINAL only |
| WordPress | Current canonical claim is local prepared-draft/admin foundation only |
| GA4/GSC | Withdrawn from live scope; manual import not implemented |
| Production | Frozen/owner-gated for new actions |
| Local development orchestration | OpenClaw/Codex/Graphify are external local development tooling only; they are not DCA OS runtime components and must not be installed on the production VPS |

## Canonical supporting documents

- [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md)
- [`STATUS.md`](./STATUS.md)
- [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)
- [`architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](./architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md)

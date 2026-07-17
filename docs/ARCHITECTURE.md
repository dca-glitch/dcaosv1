# Architecture

## Product

DCA OS Lite is an **internal agency operating system first**. Broader licensed SaaS rollout remains approved direction, not current readiness.

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
- Tenant-scoped data model with `ClientUserAccess` for client portal grants
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

## Canonical supporting documents

- [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md)
- [`STATUS.md`](./STATUS.md)
- [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

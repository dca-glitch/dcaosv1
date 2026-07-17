# Current System Snapshot

**Purpose:** concise current-system truth for external agents and maintainers.

## 1. Product identity

DCA OS Lite is the internal agency operating system for Digital Cube Agency.

- It is **not** currently documented as a general live SaaS product.
- Puriva is the first **Client Operating Pack** on the shared platform.
- Production exists, but overall readiness for new production work remains **NO** unless a current runbook/status gate explicitly authorizes it.

Primary references: [`STATUS.md`](./STATUS.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

## 2. Architecture and operating model

- Monorepo with `apps/web`, `apps/api`, `packages/data`, and `packages/shared`
- React + Vite frontend
- Node.js + Express API
- Prisma + PostgreSQL data layer
- Shared TypeScript contracts between frontend and backend
- One internet domain = one `Client`
- Tenant = workspace/licensee layer; client access is granted per `Client`, not per project

## 3. Roles and access boundaries

| Role | Current scope |
|---|---|
| `owner` / `admin` | Full operator surfaces |
| client-only users | Client-safe portal surfaces only |

Clients must not see prompts, raw workflow runs, provider metadata, AI cost internals, credentials, `storageKey`, or admin-only notes.

## 4. Current module and capability truth

| Area | State now | Notes |
|---|---|---|
| Auth/session/RBAC | IMPLEMENTED_LOCAL_FOUNDATION | Local auth path and client/admin boundaries exist; broader environment proof stays gated |
| Clients / projects / tasks | IMPLEMENTED | Admin/operator surfaces are part of the current app map |
| Client Portal MVP | IMPLEMENTED | Client-safe visibility, approvals, archive, and FINAL monthly reports only |
| AI Delivery | IMPLEMENTED_WITH_RECORDED_PROOFS | Operator-primary; detailed proof labels stay in [`STATUS.md`](./STATUS.md) and project-control matrix |
| AI Operations / Orchestrator Lite | CONFIG_SHAPE_PROVEN | Read-only/planning-oriented; not a blanket live-execution claim |
| Market Intelligence | LOCAL_FOUNDATION | Admin-only MVP; no live scraping/autonomous agent claim |
| Monthly reports | IMPLEMENTED | FINAL-only client visibility; live GA4/GSC is withdrawn |
| Finance Lite | LOCAL_FOUNDATION | Present in current app map; not a production finance-readiness claim |
| R2 private storage | RECORDED_STAGING_PROOF | Guarded by env/config; not a default-live claim |
| WordPress draft workflow | RECORDED_STAGING_PROOF | Bounded draft proof exists; DCA OS is not final WordPress administration |
| Live GA4/GSC integration | WITHDRAWN | Not deferred for automatic resumption |

## 5. Integrations, providers, and cost controls

- AI routing authority lives in [`architecture/AI_POLICY_PROVIDER_ROUTING.md`](./architecture/AI_POLICY_PROVIDER_ROUTING.md).
- Local deterministic AI execution remains the default-safe path unless a separate gate authorizes live provider use.
- Cost controls, provider routing, and kill-switch behavior are part of the current AI policy/runtime architecture.
- WordPress is an optional publishing connector, not the core content model.
- WordPress boundary: DCA OS controls approved content, blocks, and initial design artifacts; WordPress Admin controls WordPress/plugin/theme updates and final publication.
- GA4/GSC live integration is withdrawn. Manual import is not implemented.

## 6. Environment truth

| Environment | Current truth |
|---|---|
| Local | Main development and validation environment |
| Staging | Historical/recorded proofs exist; fresh action still requires explicit approval |
| Production | Runtime exists; owner-gated/frozen for new actions; readiness remains **NO** in current canonical docs |

## 7. UI truth

- **Current UI direction:** [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)
- Frontend terminology stays English-only.
- Current proof references use desktop **1440**, tablet **768**, and mobile **390** viewports.
- Current UX direction favors modal-to-page migration where it improves workflow clarity while retaining confirmation and other single-purpose overlays where appropriate.
- Older Dark Nebula design docs are historical/superseded only.

## 8. Approved direction not implemented

Treat the following as `APPROVED_DIRECTION_NOT_IMPLEMENTED` unless a higher-authority current doc says otherwise:

- broader licensed SaaS rollout
- advanced public/client collaboration features
- default live AI/provider execution across workflows
- general live WordPress publishing beyond bounded documented proofs
- GA4/GSC automation or manual import flow
- broad autonomous background agents that can spend money

## 9. Deferred, withdrawn, frozen, and historical

- **WITHDRAWN:** live GA4/GSC integration
- **FROZEN / owner-gated:** new production actions and production-readiness claims
- **HISTORICAL ONLY:** Dark Nebula direction docs, older UI rulebooks, earlier audit packs, release notes, and pre-refresh project snapshots unless current canonical docs explicitly adopt them

## 10. Current operating commands

Use the current operator procedures in [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md). Baseline validation remains:

```text
git diff --check
npm run validate
```

Run smoke only when the scoped task requires it, and never after a failed `validate`.

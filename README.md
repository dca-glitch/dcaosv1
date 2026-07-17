# DCA OS Lite

DCA OS Lite is the internal agency operating system for Digital Cube Agency.

It is a local-first monorepo for admin/operator workflows, client-safe delivery surfaces, AI-assisted content operations, monthly reporting, finance-lite workflows, and the first client operating pack for Puriva.

## What is current

- **Product stance:** internal agency OS first; broader SaaS/productization is an approved later track, not a current readiness claim.
- **Current UI direction:** **Botanical Light**. Dark Nebula is historical only.
- **Current client model:** one internet domain = one `Client`; Puriva is the first Client Operating Pack.
- **Current delivery model:** AI Delivery remains admin/operator-primary; Client Portal MVP exposes client-safe deliverables, approvals, and FINAL monthly reports only.
- **Current operations state:** production exists but readiness is **NO** and production remains owner-gated/frozen for new changes.

## Implemented and proven now

| Area | Current state |
|---|---|
| Auth/session/RBAC | Implemented local foundation |
| Client/domain model | Implemented canonical architecture |
| Client Portal MVP | Implemented client-safe visibility path |
| AI Delivery | Implemented; selected staging proofs recorded in current status docs |
| AI Operations / Orchestrator Lite | Config-shape proven; not full live execution |
| Market Intelligence | Local admin foundation |
| Monthly reports | Admin workflow + FINAL-only client visibility |
| WordPress | Dedicated bounded draft proof recorded; not general live publishing |
| R2/private storage | Recorded staging proof; still guarded by env and approval |
| GA4/GSC live integration | **Withdrawn** |

Use [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](docs/CURRENT_SYSTEM_SNAPSHOT.md) for the concise current-system view and [`docs/STATUS.md`](docs/STATUS.md) for detailed proof state.

## Approved direction, not implemented

These items may appear in historical plans or design docs, but they are **not live unless current status docs say so**:

- broader productization/licensed SaaS rollout
- public approval links and advanced client collaboration
- general live AI/provider execution as a default operating mode
- production-ready GA4/GSC automation or manual-import workflow
- autonomous background agents that spend money without explicit scope
- full system-wide conversion of every workflow to page-first UI

## Authoritative documents

1. [`docs/README.md`](docs/README.md) — documentation map and authority order
2. [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](docs/CURRENT_SYSTEM_SNAPSHOT.md) — concise current-system truth
3. [`docs/STATUS.md`](docs/STATUS.md) — detailed capability/proof ledger
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — application map
5. [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md) — canonical client/domain architecture
6. [`AGENTS.md`](AGENTS.md) — instructions for external agents

## Validation

```text
git diff --check
npm run validate
```

Run smoke scripts only when the scoped task requires them, and never after a failed `validate`.

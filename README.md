# DCA OS v2

DCA OS v2 is the private Agency Operations System for Digital Cube Agency.

## Current baseline

- **Product stance:** one private agency organization, not a public or self-service SaaS. Public signup, self-service tenant creation, tenant-admin provisioning, subscriptions, marketplace, sale/licensing of access, and independent licensee tenants are not product direction.
- **Canonical baseline:** merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`, “Complete responsive modal-to-page migration”).
- **UI baseline:** Botanical Light with complex workflow migration from modal stacks to routed pages, while short confirmation and single-purpose overlays remain modals.
- **Client session fix:** `PR #55` is the current baseline for client session restoration under local rate limiting.
- **Workspace direction:** `Workspace` is the approved primary data, authorization, reporting, cost, integration, material, and search boundary. The existing `Tenant`/`Client` model remains legacy compatibility context until the governed expand/backfill/reconciliation/switch/cleanup migration is completed.
- **Pilot:** Puriva is the first External Client Workspace and production pilot, not a fork or separate product.
- **Delivery model:** AI Delivery remains admin/operator-primary; Client Portal MVP is client-safe visibility, approvals, archive, and FINAL monthly reports only.
- **Production posture:** production exists, but current readiness for new production work remains **NO** unless a current runbook explicitly authorizes it.

## Current proof baseline

| Proof | Result | Source |
|---|---|---|
| Web unit tests | **362/362 PASS** | `PR #55` validation |
| AI Delivery workflow deep links | **85/85 PASS** | `PR #55` + `scripts/smoke-ai-delivery-workflow-pages-deep-link-local.mjs` |
| System-wide responsive route proof | **124/124 PASS** | `PR #55` + `scripts/smoke-system-wide-routes-viewports-local.mjs` |
| Genuine Client-role Botanical proof | **98/98 PASS** (twice in `PR #55`) | `PR #55` + `scripts/smoke-client-role-botanical-proof-local.mjs` |

## Capability guardrails

- **WordPress:** local prepared-draft handoff and bounded admin foundations exist; live HTTP draft/publish is **not** current capability and must not be claimed from canonical docs.
- **GA4/GSC:** not currently implemented. Approved future direction is `ADMIN_LIVE` (`APPROVED_DIRECTION_NOT_IMPLEMENTED`): live GA4/GSC for DCA Admin only, separate service account per Website; Client Manager and Client User receive FINAL monthly reports only. Manual import is **not implemented**. This package does not implement OAuth, service accounts, sync, or any live integration.
- **Client safety:** clients must not see prompts, provider internals, raw workflow runs, AI cost details, credentials, `storageKey`, or admin-only notes.

## Authority order

1. [`docs/README.md`](docs/README.md)
2. [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](docs/CURRENT_SYSTEM_SNAPSHOT.md)
3. [`docs/STATUS.md`](docs/STATUS.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
6. [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
7. [`docs/operator/OPERATOR_RUNBOOK.md`](docs/operator/OPERATOR_RUNBOOK.md)
8. [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

Apply [`AGENTS.md`](AGENTS.md) only after reading the authority chain above.

## Validation

```text
git diff --check
npm run validate
```

Run smoke only when the scoped task requires it, and never after a failed `validate`.

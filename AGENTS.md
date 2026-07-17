# AGENTS.md

## Read this repository in this order

1. [`README.md`](README.md)
2. [`docs/README.md`](docs/README.md)
3. [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](docs/CURRENT_SYSTEM_SNAPSHOT.md)
4. [`docs/STATUS.md`](docs/STATUS.md)
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
6. [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
7. [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
8. [`docs/operator/OPERATOR_RUNBOOK.md`](docs/operator/OPERATOR_RUNBOOK.md)
9. [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

Apply the rest of this file only after reading that authority chain.

## Document authority rules

- Treat files explicitly marked **historical evidence**, **superseded**, **closeout**, or **proposal** as non-authoritative.
- Use [`docs/DOCUMENTATION_INVENTORY.json`](docs/DOCUMENTATION_INVENTORY.json) for file-by-file classification.
- Use [`docs/DOCUMENTATION_DISPOSITION.md`](docs/DOCUMENTATION_DISPOSITION.md) for the retained-vs-deleted refresh summary.
- Do not revive Dark Nebula or old next-gate ledgers as current truth.

## Current system truth you must preserve

- DCA OS Lite is an **internal agency operating system first**.
- Puriva is the first **Client Operating Pack** on the shared platform.
- AI Delivery is still **admin/operator-primary**; Client Portal MVP is client-safe visibility, approvals, archive, and FINAL monthly reports only.
- Clients must not see prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin-only notes.
- **Botanical Light** is the current UI direction. The frontend stays English-only.
- Current responsive proof references are desktop **1440**, tablet **768**, and mobile **390**.
- Complex workflows now prefer routed pages; short confirmation and single-purpose overlays may remain modals.
- Live GA4/GSC integration is **WITHDRAWN**. Manual import is **not implemented**.
- WordPress is an optional publishing connector. Current canonical docs only permit local prepared-draft/admin foundations unless a retained proof document explicitly records something narrower.
- Production exists but readiness is **NO** for new work unless current canonical docs explicitly authorize a separate gate.

## Agent operating rules

- Prefer the smallest safe change that fully resolves the task.
- Validate with `git diff --check` and `npm run validate` before claiming completion.
- Never run smoke after a failed `validate`.
- Do not inspect `.env` files, print secrets, or invent environment values.
- Do not treat historical audits, release notes, staging proofs, or production proofs as current implementation authority unless canonical docs explicitly adopt them.
- Do not treat approved direction as implemented; label it `APPROVED_DIRECTION_NOT_IMPLEMENTED` when relevant.

## Current UI authority

Use [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) for current UI rules and proof references.

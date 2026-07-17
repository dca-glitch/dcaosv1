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

If any lower-priority document conflicts with those files, the higher-priority file wins. Apply the rest of this file after reading that authority chain.

## Document authority rules

- Treat files explicitly marked **historical**, **superseded**, or **proposal** as non-authoritative.
- Do not revive deleted or superseded Dark Nebula guidance as current UI direction.
- Use [`docs/DOCUMENTATION_INVENTORY.json`](docs/DOCUMENTATION_INVENTORY.json) for file-by-file classification.
- Use [`docs/DOCUMENTATION_DISPOSITION.md`](docs/DOCUMENTATION_DISPOSITION.md) for what was deleted, consolidated, retained as historical, or updated in this refresh.

## Current system truth you must preserve

- DCA OS Lite is an **internal agency operating system first**.
- Puriva is the first **Client Operating Pack** on the shared platform.
- AI Delivery is still **admin/operator-primary**; Client Portal MVP is client-safe visibility, approvals, and FINAL monthly reports only.
- Clients must not see prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin-only notes.
- **Botanical Light** is the current UI direction. The frontend stays English-only.
- Current responsive proof references are desktop **1440**, tablet **768**, and mobile **390**.
- The current UI trend is modal-to-page where it improves workflow clarity; confirmation and other single-purpose overlays may remain modals.
- Live GA4/GSC integration is **WITHDRAWN**. Manual import is **not implemented**.
- WordPress responsibility boundary: DCA OS prepares approved content, blocks, and initial design artifacts; WordPress Admin owns WordPress/plugin/theme updates and final publication control.
- Production exists but readiness is **NO** for new work unless the current status/runbooks explicitly authorize a separate gate.

## Agent operating rules

- Prefer the smallest safe change that fully resolves the task.
- Validate with `git diff --check` and `npm run validate` before claiming completion.
- Never run smoke after a failed `validate`.
- Do not inspect `.env` files, print secrets, or invent environment values.
- Do not treat historical audits, release notes, or staging/production evidence as current implementation authority unless the canonical docs say they still apply.
- Do not treat approved direction as implemented; label it `APPROVED_DIRECTION_NOT_IMPLEMENTED` when relevant.

## Current UI authority

Use [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) for current UI rules and proof references.
Dark Nebula docs are historical only.

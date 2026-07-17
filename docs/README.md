# Documentation Map

This directory contains both current operating documents and retained historical evidence.

## Authority order

Use documents in this order when you need current truth:

1. [`../README.md`](../README.md)
2. [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md)
3. [`STATUS.md`](./STATUS.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
5. [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
6. [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
7. [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)
8. [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

`AGENTS.md` follows this same authority order and then adds agent-specific operating rules.

## Current canonical documents

| File | Role |
|---|---|
| [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md) | Fast whole-system snapshot for external agents and maintainers |
| [`STATUS.md`](./STATUS.md) | Detailed capability, proof, and environment status ledger |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Current application map |
| [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md) | Canonical client/domain/tenant model |
| [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) | Current capability label system and project-control vocabulary |
| [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md) | Current operator procedures and validation order |
| [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) | Current UI direction and proof references |

## Supporting indexes

- [`DOCUMENTATION_INVENTORY.json`](./DOCUMENTATION_INVENTORY.json) — file-by-file classification for repository-root docs and everything under `docs/`
- [`DOCUMENTATION_DISPOSITION.md`](./DOCUMENTATION_DISPOSITION.md) — deleted, renamed, consolidated, retained-historical, and updated files in this refresh

## Directory guide

| Directory / file group | Default interpretation |
|---|---|
| `architecture/`, `project-control/`, `operator/`, `runbooks/` | Current supporting docs unless a file says historical/superseded |
| `ui/` | Mixed: Botanical Light file is current; older Dark Nebula/design proposals are superseded |
| `design/`, `ui-ux/` | Historical or superseded design/audit material unless a file explicitly says otherwise |
| `audit/`, `audits/`, `releases/`, `reviews/` | Historical evidence / proof provenance |
| files prefixed with `_` | Temporary/proposal material; non-authoritative |

## Reading rules

- If a document is marked **historical**, **superseded**, **proposal**, or **docs-only evidence**, do not use it as current system truth.
- If a capability is only planned, mark it `APPROVED_DIRECTION_NOT_IMPLEMENTED` rather than implemented.
- Dark Nebula references are historical unless a document explicitly discusses history or retained evidence.

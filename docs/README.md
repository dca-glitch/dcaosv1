# Documentation Map

This directory keeps a small current authority chain plus only the supporting references and historical evidence that still have recovery, security, deployment, or proof-provenance value.

## Authority order

Use documents in this exact order when you need current truth:

1. [`../README.md`](../README.md)
2. [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md)
3. [`STATUS.md`](./STATUS.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
5. [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
6. [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
7. [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)
8. [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

Apply [`../AGENTS.md`](../AGENTS.md) only after the authority chain above.

## Canonical current documents

| File | Role |
|---|---|
| [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md) | Concise whole-system truth |
| [`STATUS.md`](./STATUS.md) | Current post-`998c294` capability and proof baseline |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Current application map |
| [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md) | Canonical client/domain/publication model |
| [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) | Current status vocabulary and capability labels |
| [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md) | Current validation and operator guardrails |
| [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) | Complete current UI authority |

## Supporting indexes

- [`DOCUMENTATION_INVENTORY.json`](./DOCUMENTATION_INVENTORY.json) — file-by-file classification for retained docs
- [`DOCUMENTATION_DISPOSITION.md`](./DOCUMENTATION_DISPOSITION.md) — deleted, retained, and refreshed documentation in this pass

## Reading rules

- Treat files classified as **historical evidence**, **superseded plan**, **superseded UI pack**, **closeout**, or **proposal** as non-authoritative.
- Treat approved future designs as `APPROVED_DIRECTION_NOT_IMPLEMENTED` unless current canonical docs say they are implemented.
- Dark Nebula is historical only. Botanical Light is the active UI authority.
- Historical staging/production proofs remain evidence, not standing authorization.

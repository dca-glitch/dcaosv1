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
9. [`project-control/DCA_OS_V2_DECISION_REGISTER.md`](./project-control/DCA_OS_V2_DECISION_REGISTER.md)
10. [`project-control/DCA_OS_V2_PHASE_0_12_EXECUTION_PLAN.md`](./project-control/DCA_OS_V2_PHASE_0_12_EXECUTION_PLAN.md)
11. [`security/PHASE_1_WORKSPACE_AUTHORIZATION_MATRIX.md`](./security/PHASE_1_WORKSPACE_AUTHORIZATION_MATRIX.md)
12. [`architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](./architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md)

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
| [`project-control/DCA_OS_V2_DECISION_REGISTER.md`](./project-control/DCA_OS_V2_DECISION_REGISTER.md) | Binding owner-approved DCA OS v2 decisions |
| [`project-control/DCA_OS_V2_PHASE_0_12_EXECUTION_PLAN.md`](./project-control/DCA_OS_V2_PHASE_0_12_EXECUTION_PLAN.md) | Binding execution status and sequencing |
| [`security/PHASE_1_WORKSPACE_AUTHORIZATION_MATRIX.md`](./security/PHASE_1_WORKSPACE_AUTHORIZATION_MATRIX.md) | Phase 1 target authorization model |
| [`architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](./architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md) | Compatibility and safe migration contract |

## Supporting indexes

- [`DOCUMENTATION_INVENTORY.json`](./DOCUMENTATION_INVENTORY.json) — file-by-file classification for retained docs
- [`DOCUMENTATION_DISPOSITION.md`](./DOCUMENTATION_DISPOSITION.md) — deleted, retained, and refreshed documentation in this pass

## Current Phase 2 supporting contracts (not authority-chain peers)

These are current supporting implementation contracts. They do **not** replace the authority order above.

| File | Status labels |
|---|---|
| [`implementation/P2_A_OFFLINE_FOUNDATION.md`](./implementation/P2_A_OFFLINE_FOUNDATION.md) | `IMPLEMENTATION_READY_AUTHORIZED` / `PHASE_2_RUNTIME_NOT_STARTED` |
| [`implementation/P2_A_OWNER_LOCAL_EXPORTER.md`](./implementation/P2_A_OWNER_LOCAL_EXPORTER.md) | `BUILD_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED` |
| [`implementation/P2_B_OWNER_EXECUTION_GATE.md`](./implementation/P2_B_OWNER_EXECUTION_GATE.md) | `DOCS_ONLY_AUTHORIZED` / `EXECUTION_NOT_AUTHORIZED` |

Evidence path contract: `C:\dcaosv1-p2-evidence` ↔ WSL `/mnt/c/dcaosv1-p2-evidence` (one physical location, outside Git).

## Reading rules

- Treat files classified as **historical evidence**, **superseded plan**, **superseded UI pack**, **closeout**, or **proposal** as non-authoritative.
- Treat approved future designs as `APPROVED_DIRECTION_NOT_IMPLEMENTED` unless current canonical docs say they are implemented.
- Dark Nebula is historical only. Botanical Light is the active UI authority.
- Historical staging/production proofs remain evidence, not standing authorization.
- Live GA4/GSC `ADMIN_LIVE` is approved direction only, never a current implementation claim.

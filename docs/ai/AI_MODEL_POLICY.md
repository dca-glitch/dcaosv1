# AI Model Policy — DCA OS Lite

**Status:** Approved (G55, 2026-07-09)  
**Scope:** Owner-level AI/provider decisions for pre-live readiness  
**Audience:** Product owner, operators, implementers  

---

## 1. Core principles

| Policy | Decision |
|--------|----------|
| Medical data collection | **DCA OS / Lite does not collect medical data** |
| Normal SaaS data | System may process user/client/billing/subscription/portal data for operations |
| AI default | AI workflows **do not process personal/SaaS/billing data by default** |
| Marketing scope | Website and social media content are **in scope** |
| Paid ads | **Out of scope** / very far future |
| Puriva AI monthly cap | **$100 USD hard cap** per client operating pack period |
| AI output | **Review-ready only** — not auto-publishable |
| Client visibility | **Human approval required** before client-visible output |
| Live providers | **No live provider calls** unless explicitly enabled by owner |
| Auto publication | **No automatic publication** |
| Provider roles | **Configurable** via provider registry (not hardcoded per button) |
| Orchestrator | **AI Orchestrator Lite** is the approved coordination layer above AI Gateway |

---

## 2. Data boundaries

### Allowed in AI-safe context (when approved)

- Client brief (approved)
- Approved business facts
- Public research
- SEO plans, outlines, drafts (internal workflow)
- Report metrics (aggregated, non-PII)
- Social copy drafts
- Image prompts (marketing-safe)

### Forbidden in AI context

- Medical/patient records
- Before/after clinical imagery (except Vision Technical QA when explicitly enabled)
- Raw SaaS credentials, passwords, tokens
- Cross-tenant data
- Unapproved raw client notes

### Not sent to AI by default

- User account details
- Billing/subscription records
- Internal audit metadata
- Email addresses and contact PII

---

## 3. Provider execution modes

| Mode | Behavior |
|------|----------|
| `disabled` | No AI text execution |
| `local` | Deterministic local scaffold (default) |
| `live` | Routed through AI Gateway v1 only when owner enables and credentials exist |

Live execution requires separate proof per [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md).

---

## 4. Budget policy

- Puriva operating pack: **$100 USD/month** hard cap
- Budget guard blocks projected over-budget workflows
- Kill switch activates when cap is exceeded
- `actualCostUsd` remains **null** until a trusted provider cost source is integrated (`leave_null_until_trusted_provider_cost`)
- Do **not** fabricate actual cost from estimates, route caps, token×list-price, or marketing pricing pages
- Estimated AI cost is budget-control data only — **not** an invoice and **not** Finance Lite proof
- Reporting/reconciliation contract: [`../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md`](../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md)

---

## 5. Approval and visibility

| Output state | Client visible |
|--------------|----------------|
| Internal / draft | No |
| Review-ready | Admin only |
| Approved final | Yes (Client Portal FINAL-only) |

---

## 6. Related documents

- [`AI_ORCHESTRATOR_LITE.md`](./AI_ORCHESTRATOR_LITE.md)
- [`AI_AGENT_ROLES_AND_TASKS.md`](./AI_AGENT_ROLES_AND_TASKS.md)
- [`AI_MATERIAL_CLASSIFICATION.md`](./AI_MATERIAL_CLASSIFICATION.md)
- [`PURIVA_AI_PRELIVE_WORKFLOW_PACK.md`](./PURIVA_AI_PRELIVE_WORKFLOW_PACK.md)
- [`../architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md)

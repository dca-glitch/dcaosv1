# AI Material Classification — DCA OS Lite

**Status:** Approved (G55, 2026-07-09)  
**Guard:** `apps/api/src/core/ai-material-policy.guard.ts`  

---

## Material classes

| Class | AI default | Notes |
|-------|------------|-------|
| `client_brief` | Allowed (approved) | WorkflowBrief approved context |
| `approved_business_facts` | Allowed | Knowledge layer APPROVED items |
| `public_research` | Allowed | External/public sources |
| `seo_plan` | Allowed | Internal planning artifact |
| `article_outline` | Allowed | Internal draft scaffold |
| `article_draft` | Allowed | Review-ready internal |
| `report_metrics` | Allowed | Aggregated metrics only |
| `social_copy` | Allowed | Marketing copy drafts |
| `image_prompt` | Allowed | Prompt scaffolds |
| `stock_ai_marketing_asset` | Allowed | Stock/manual assets |
| `before_after_asset` | **Vision QA only** | Client-provided marketing asset |
| `saas_user_account_billing_data` | **Excluded** | Not sent to AI by default |
| `forbidden_medical_data` | **Blocked** | Always forbidden |

---

## Policy rules

1. Medical data is **always forbidden**
2. SaaS/user/billing data is **excluded by default**
3. Before/after assets route only to Vision Technical QA when enabled
4. AI-safe context pack includes only approved business/marketing data
5. No raw sensitive asset retention beyond operating pack policy

---

## AI-safe context pack

Built from:
- Approved WorkflowBrief context
- Approved knowledge items (`allowedForPrompt = true`, status APPROVED)
- Governance preamble (fixed rules in `ai-context-builder.service.ts`)

Excluded automatically:
- Expired knowledge
- Raw/unapproved notes
- Cross-tenant rows
- Credentials and secrets (sanitized)

---

## Preview API

`POST /api/v1/ai-orchestrator-lite/material-routing-preview` returns:
- `inputMaterials` — included after policy
- `excludedMaterials` — excluded with reason
- `policyChecks` — allow/block decision

---

## Finance Lite / SaaS data boundary (G56)

- Normal SaaS/user/account/billing/subscription data may exist in Finance Lite and platform tables.
- Such data is **not routed to AI by default** (`saas_user_account_billing_data` class).
- No medical data collection in AI workflows.
- Payment provider integrations are out of scope for pre-live orchestration.

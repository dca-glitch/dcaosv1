# Puriva AI Pre-Live Workflow Pack — DCA OS Lite

**Status:** Approved policy profile (G55, 2026-07-09)  
**Profile key:** `PURIVA_OPERATING_PACK_V1`  
**Code:** `apps/api/src/core/puriva-ai-policy-profile.ts`  

---

## Puriva AI policy

| Rule | Value |
|------|-------|
| Website content | In scope |
| Social media | In scope |
| Paid ads | **Out of scope** |
| Medical data collection | **No** |
| AI output | Review-ready only |
| Compliance review | Required for medical/aesthetic marketing |
| Monthly AI cap | **$100 USD** |
| Human approval | Required before client-visible output |

---

## Before/after policy

| Rule | Value |
|------|-------|
| Asset type | Client-provided marketing asset |
| Consent/legal basis | Client manages |
| Originals | Temporary only |
| Working files | Temporary only |
| Final export retention | Max **60 days** |
| AI use | Vision technical QA only |
| Outcome enhancement | **Forbidden** |

---

## AI-generated people

| Rule | Value |
|------|-------|
| Style | Neutral lifestyle/wellness only |
| Fake doctors | **Forbidden** |
| Fake patients | **Forbidden** |
| Procedures | **Forbidden** |
| Treatment-result imagery | **Forbidden** |

---

## Workflow preset (pre-live)

1. Client brief review
2. AI-safe context pack
3. Research pack
4. SEO plan
5. Article outlines
6. Article drafts
7. Compliance review
8. Rewrite/polish
9. Image prompts
10. Admin final review

**No live provider execution** in pre-live mode. All steps use local deterministic scaffolds or planning preview.

---

## Related Puriva modules

Existing deterministic scaffolds in `apps/api/src/core/puriva-*.ts`:
- Service taxonomy, medical compliance, market intelligence
- SEO plan, content production, image package
- Manual metrics, monthly report, finance attribution

---

## Related documents

- [`../architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md)
- [`AI_MODEL_POLICY.md`](./AI_MODEL_POLICY.md)
- [`AI_ORCHESTRATOR_LITE.md`](./AI_ORCHESTRATOR_LITE.md)

# Puriva Monthly Operation Runbook

**Status:** Operator runbook for Puriva Client Operating Pack monthly delivery.  
**Authority:** [`PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) · shared pack constants in `@dca-os-v1/shared`.  
**Production:** FROZEN — this runbook does not authorize production mutation.

---

## 1. Operating model

| Item | Value |
|------|--------|
| Client | Puriva (`puriva.id`) |
| Location | Bali, Indonesia |
| Audience | Local clients + medical tourists |
| Channels | Website + social only (paid ads out of scope) |
| Language MVP | English primary; ID+EN allowed with approval |
| Monthly AI cap | **USD 100** (`PURIVA_MONTHLY_AI_CAP_USD`) |
| Budget tracking | PROVEN via AI budget ledger |
| Budget hard enforcement | Estimated spend kill-switch PROVEN; trusted `actualCostUsd` NOT_PROVEN |
| Staging WP host | `purivastaging.digitalcubeagency.net` only |
| Production WP | Draft/handoff only — never auto-publish |

---

## 2. Monthly cycle (admin-operated)

1. Create monthly AI Delivery project (`targetMonth=YYYY-MM`)
2. Complete brief (audience, tone, compliance, forbidden claims)
3. Research — fixture or admin-reviewed summary (live crawl not required)
4. Content plan — at least one website article item; no paid ads
5. Article draft — educational, medically cautious; run compliance scan
6. Admin article review (mandatory)
7. Image package — neutral wellness/lifestyle only; reject reason required
8. Admin + client image/article approval (where product supports)
9. WordPress **draft only** after image approval
10. Monthly report FINAL — fixture/manual metrics if GA/GSC deferred; never label as live Google
11. Client portal archive visibility (FINAL deliverables/reports only)
12. Cleanup proof artifacts by exact IDs

Local rehearsal smoke:

```powershell
cd C:\dcaosv1
node scripts/smoke-puriva-monthly-rehearsal-local.mjs
```

---

## 3. Compliance (content)

| Rule | Automated | Manual review |
|------|-----------|---------------|
| Cure claims | Hard block | Still review context |
| Guaranteed outcomes / weight-loss promises | Flag revise/review | Required |
| Before/after framing | Review (text) / hard block (image) | Required |
| Fake doctor endorsement | Review (text) / hard block (image) | Required |
| Unsupported BPOM / regulatory claims | Require medical review | Required — evidence |
| Neutral educational + consultation language | Allow path | Spot-check |

`AUTOMATED_GUARD=PROVEN` for encoded patterns. `MANUAL_REVIEW_REQUIRED=true` for MVP.

---

## 4. Image policy

Allowed: neutral lifestyle/wellness, calm clinic ambience without procedure staging.  
Forbidden: procedures, needles, before/after, fake doctors/patients, outcome implication, fabricated clinical settings.  
Retain: prompts, alt text, accept/reject decisions and reasons.

---

## 5. Provider failure fallbacks

| Provider | Fallback |
|----------|----------|
| AI text | Stay on local deterministic; do not arm live gateway without owner gate |
| Image | Use fixture scaffolds; regenerate only rejected slots after approval |
| R2 | Fail closed — no filesystem fallback; retry later |
| Email | Email is priority path; if Resend unavailable use out-of-band owner email and log SKIPPED/FAILED |
| WordPress | Draft-prep only; manual WP admin if adapter fails; never publish |
| GA/GSC | MANUAL / placeholder metrics with explicit non-live label |

---

## 6. Role boundaries

- **Admin:** full operational detail, WP prep, report FINAL, budget visibility
- **Client:** Puriva-only; FINAL deliverables/reports; no storageKey/provider metadata/MI internals; approvals where product allows
- **Negative:** foreign project/report/image IDs → 403/404; revoked ClientUserAccess → hidden

---

## 7. Owner gates before production Puriva month

1. Staging recipient email (if email proof required)
2. Visual approval of rehearsal content/images if live-generated
3. Retain vs trash staging WP draft
4. Explicit `APPROVE_PRODUCTION_DEPLOY` (separate workstream)
5. Exact `PURIVA_GA4_PROPERTY_ID` + `PURIVA_GSC_SITE_PROPERTY` before any live Google claim

---

## 8. Truth labels

Do not claim Puriva Launch READY until launch-gate criteria are green or owner-waived item-by-item.  
Preferred closeout for this workstream: `PURIVA_GO_LIVE_READINESS=READY_WITH_OWNER_GATES`.

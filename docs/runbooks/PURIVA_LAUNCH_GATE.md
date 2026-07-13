# Puriva Launch Gate — 15-Area Evaluation

> **LIVE GA4/GSC WITHDRAWN (2026-07-13):** Live GA4/GSC is **not** a Puriva Launch blocker. MANUAL/snapshot monthly reports remain. Historical area #1 and criterion #6 references below are superseded.

**Status:** Docs-only evaluation. Overall verdict: **BLOCKED**. G148 recorded G89-G147 local/no-IO foundations. G228 recorded G149-G227 expanded local foundations. G468 recorded G229-G467 deepened local foundations. G708 recorded G469-G707 ultra-block consolidated local foundations (R2/storage + private delivery, notification taxonomy, email no-send, GA/GSC OAuth design, monthly output guards, WordPress draft helpers, image compliance, Client Portal/approval serializers, Puriva pack, future-module contracts, AI budget/orchestrator guards, security inventories, operator runbooks, UI testability, stale-claim sweep) — still local/docs only. **PRE-STAGING CLOSURE (2026-07-10):** local/no-live bug scan, safe boundary/budget/UI fixes, and operator closeout completed — see [`PRE_STAGING_CLOSURE_VERDICT.md`](../operator/PRE_STAGING_CLOSURE_VERDICT.md). Local pre-staging closure **PASS** does **not** change any launch-area live-proof verdict. This document does not authorize Puriva Launch, live integrations, or production client-facing use.

**Gate separation:** Puriva Client-Service Launch Gate is independent from the DCA OS Production v1 Gate (G49 → G50). Clearing G49/G50 does **not** authorize Puriva Launch, and vice versa.

**Source of truth:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) · [`docs/architecture/CLIENT_OPERATING_PACKS.md`](../architecture/CLIENT_OPERATING_PACKS.md) · [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) · [`docs/STATUS.md`](../STATUS.md) · [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](../security/SECURITY_BOUNDARY_AUDIT.md) · [`docs/runbooks/IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md) · [`docs/runbooks/EMAIL_NOTIFICATIONS_PROOF.md`](./EMAIL_NOTIFICATIONS_PROOF.md)

---

## 1. Overall verdict

**BLOCKED.** G89-G707 add useful local/admin foundations across storage, private delivery, notifications, analytics helpers, WordPress draft preparation, image compliance/approval-loop, Client Portal visibility, operating packs, future-module contracts, AI budget reporting, orchestrator local guards, and operator/security/UI inventories. None closes Puriva Launch. No staging/prod live proof, live AI call, email send, Google OAuth/sync, WordPress HTTP call, image-provider call, R2 IO, commit, push, or deploy is claimed here.

8 of 15 evaluation areas remain fully blocked pending live proof or a not-yet-started product/policy gate. 2 more areas have real local scaffolding but cannot support a live client-facing claim yet. 5 areas are genuinely usable now in local/admin-operated form only.

---

## 1b. Security gate (SEC-B1)

| Item | Status |
|------|--------|
| SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR | **FIXED (local)** — `requireTenant` + tenant-scoped client/brief checks; confirm commit presence on target SHA before G50; does **not** authorize Puriva Launch |
| Regression test | `apps/api/tests/integration/briefs-tenant-boundary.integration.test.ts` |
| SEC-H1 admin `storageKey` exposure | **OPEN** — separate block recommended |
| Puriva launch impact | SEC-B1 was a **production safety blocker**; fix must be present on the deploy SHA and validated before G50. Clearing SEC-B1 does **not** make Puriva Launch ready. |

---

## 2. 15-area evaluation

| # | Area | Verdict | Evidence / gap |
|---|------|---------|-----------------|
| 1 | GA/GSC live proof | **WITHDRAWN** | Owner decision 2026-07-13 — live GA4/GSC OAuth/sync not in scope. MANUAL/snapshot monthly reports remain. Not a launch blocker. |
| 2 | R2/storage live proof | **BLOCKED** | G89-G93 add no-IO readiness/proof-stage/storage-key guard foundation. Disabled-safe local behavior is proven; no real bucket round-trip ever executed. See [`STORAGE_R2_PROOF.md`](./STORAGE_R2_PROOF.md). |
| 3 | Live AI text proof | **PARTIAL — local only** | Local controlled OpenRouter execute proven (G71e/G71e-retry, G75, G77b COMPLETED ledger row `5d8d635c-ced0-4a14-9b33-839e1fdee508`; G79 monthly aggregation includes live `COMPLETED` rows locally; `actualCostUsd=null` per G80 policy until trusted provider cost exists). Staging/production live **NOT** claimed; Puriva Launch still requires staging/production re-proof. |
| 4 | Image generation provider research | **BLOCKED** | No provider selected. G115-G119 add compliance policy/helper foundation with zero live calls. Full flow spec: [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md). Provider selection itself remains not started. |
| 5 | Image generation staging proof | **BLOCKED** | Depends on #4 + R2 live proof + AI Model Policy; scaffold exists (`prepare-image-sets`) plus the new Phase B disabled-safe foundation, but no live provider client is wired and none was called in this block. |
| 6 | Transactional notification proof (in-system + email) | **BLOCKED** | G94-G102 add taxonomy/mapping/policy/no-send adapter/template foundation only. No in-system notification model exists yet. Email/outbox is disabled-safe/no-send locally; real email send via Resend has never been executed. |
| 7 | WordPress draft/handoff readiness | **PASS (local draft-prep only)** / **PLANNED, NOT EXECUTED (live draft proof)** — not “WordPress ready” for live HTTP or publish | G110-G113 add draft payload, credential-shape checks, and publish-freeze-before-fetch coverage. Draft preparation and operator handoff are local-only; required scope for Puriva Launch is draft/handoff, not auto-publish. A live draft proof **plan** is written in [`WORDPRESS_DRAFT_PROOF.md`](./WORDPRESS_DRAFT_PROOF.md) §6 — docs only, no live WordPress call made. Three gaps must be explicitly resolved before that session can run: no `altText`/`caption`/`socialPreview` fields on `AiDeliveryArticleImage`, no idempotency key on `PublicationLog`, no code-level approved-image-only filter. |
| 8 | Integration health visibility | **PASS (local/admin)** / **BLOCKED (live)** | `GET /api/v1/integrations/readiness` gives admin-visible config-shape health today; there is nothing live to show health for until other live proofs close. |
| 9 | AI Model Research Gate | **BLOCKED** | Not started. |
| 10 | AI Model Policy | **BLOCKED** | Depends on #9. |
| 11 | Client Portal approval UX | **PASS (local/admin-operated MVP)** / **BLOCKED (production-proven claim)** | G120-G123 add leak hardening and FINAL guards locally. Approval happy-path is smoke-proven locally; no staging/production browser QA evidence exists yet. |
| 12 | Task-oriented admin UX / admin operating checklist | **PASS (local)** | Admin daily operations cockpit (Ready now / Needs review / Blocked-waiting) and Puriva operating pack checklist exist and are smoke-proven. |
| 13 | Client profiles and boundaries (medical compliance, content/tone, image profile/dimensions) | **PARTIAL — usable as documented checklist** | G124-G127 add shared Client Operating Pack/Puriva constants and tests. Per `CLIENT_OPERATING_PACKS.md` §7, profiles may start as documented operator checklists before becoming structured configuration; usable now as admin discipline, not yet a database-enforced control. |
| 14 | Article + Image Package Workflow v1 | **PASS (local scaffold/workflow shape)** / **BLOCKED (full live proof)** | Step order, reject-reason, regenerate-only-rejected, upscale-after-approval, and social-preview rules are documented and largely implemented as a workflow scaffold; full proof requires live image generation (#4/#5). |
| 15 | Monthly Report Flow v1 + feedback learning layer | **PASS (local/client-safe FINAL-only report)** / **BLOCKED (feedback learning)** | Admin report lifecycle, PDF, and client FINAL-only visibility are smoke-proven locally with MANUAL/snapshot metrics; live GA4/GSC **WITHDRAWN**; a dedicated feedback-learning-notes persistence layer was not found in code this session — treat as not started, not partially built. |

---

## 2b. Approval UX smoke evidence detail (areas 11 & 14)

Full coverage matrix and gap list: [`docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md`](../ux/ADMIN_WORKFLOW_POLISH_AUDIT.md) § "Puriva approval UX smoke coverage (detail)".

Summary for the launch gate (docs-only clarification, added 2026-07-09 — no verdict change):

- Article send-for-review, the client-safe pending-approvals list, article approve (browser-proven), article reject-with-reason (API-proven), WordPress draft-prep gating, and final archive visibility are all smoke-proven locally — consistent with the row 11 **PASS (local/admin-operated MVP)** verdict.
- **Newly documented gap:** the client-portal image-set `reject` and `undo` endpoints (`PATCH .../images/:imageId/reject`, `.../undo`) have zero smoke or integration coverage, the article-level "Request changes" button is never driven by browser automation (only exercised via direct API call), and the server-side `IMAGES_PENDING` article-approval gate is untested. These are existing implementation paths, not new code — the gap is in test coverage only.
- This does not change the row 11 or row 14 verdicts above; it narrows exactly what "smoke-proven locally" currently does and does not include for the image-set approval sub-path. Recommend closing before any staging/production approval-UX proof (criterion 7 in §6) is claimed.

---

## 3. What is usable now (admin-operated, local, not client-facing on production)

- Full local Puriva E2E operator foundation: intake → compliance → AI Knowledge/context → WorkflowBriefs → SEO plan → content/compliance → image/asset handoff scaffold → WordPress prepared draft → client-safe monthly report/archive → client approval happy path.
- Admin daily operations cockpit with a discoverable first-client path and explicit deferred/gated labeling.
- Client Portal read-only archive and FINAL-only monthly reports, proven locally, not deployed to any client-facing production environment.
- WordPress draft/handoff preparation (no auto-publish). A live draft proof **plan** exists (`WORDPRESS_DRAFT_PROOF.md` §6) but has not been executed against any real WordPress site; that plan, not an executed proof, is what is usable now.

## 4. What is not client-facing / remains blocked

Nothing in the Puriva delivery path may be shown to a real client on a production environment until the fully-blocked areas above (rows 2, 3, 4, 5, 6, 9, 10, and the live-proof portions of 14 and 15) are closed with real evidence — not local-only or config-shape evidence. Row 1 (GA/GSC) is **WITHDRAWN**, not blocked.

**Explicit image generation blockers:**

- No live image provider wired or proven
- R2 image byte roundtrip not proven on target bucket
- Social preview generation not proven end-to-end
- Medical compliance review gate for generated imagery not live-proven

**Explicit security blockers (pre-launch):**

- SEC-B1 fix must be committed and pass `npm run validate` + integration test
- SEC-H1 (`storageKey` in admin deliverable list) should close before production G50

## 5. Deferred (intentionally out of scope, not blockers)

Per `deferred-scope-register.md`: WordPress auto-publish, marketing email, SMS/WhatsApp, full SaaS onboarding, second-client proof, advanced learning dashboard, A/B testing, full DB-backed custom roles UI. These do not need to close before Puriva Launch — they are separate future tracks.

## 6. Launch PASS criteria (all required)

1. SEC-B1 regression test PASS on target commit
2. R2 live proof PASS on staging bucket (documents + generated images)
3. Live AI text proof PASS on the target environment (bounded, owner-approved; local G77b/G79 is not enough)
4. Image generation provider selected + staging proof PASS per [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md)
5. In-system notification MVP plus transactional email live proof PASS
6. ~~GA/GSC live proof PASS~~ — **WITHDRAWN** (not required for launch)
7. Client portal approval UX proven on staging browser
8. WordPress draft handoff proven on staging — including one owner-approved, staging-only live draft proof session executed per `WORDPRESS_DRAFT_PROOF.md` §6 (title/body/meta parity, approved-image-only attach, alt/caption/social preview, idempotency, cleanup marker, disabled-safe restore), not just the local plan/docs
9. No HIGH security findings open (SEC-H1 minimum)

---

## 7. Recommended next blocks (ordered by lowest-effort-to-close-first)

1. **G229 recommended: owner-selected launch-blocker execution gate** — recommended first candidate is R2 target-environment real-bucket proof because it is low blast radius and unlocks document/image proof paths. See [`G227_NEXT_30_GATES.md`](../operator/G227_NEXT_30_GATES.md).
2. **Notifications MVP block** — create/prove in-system notification model before claiming transactional notification readiness; email live send remains a separate owner-approved proof.
3. **AI target-environment re-proof** — bounded OpenRouter proof on staging/target environment after owner approval; G79 local aggregation is already done, but target proof remains blocked.
4. ~~**GA/GSC live proof path**~~ — **WITHDRAWN** (not in scope).
5. **WordPress live draft proof** — plan already written (`WORDPRESS_DRAFT_PROOF.md` §6); first close §6.3-§6.5 gap decisions, then run one owner-approved staging-only session.
6. **Image generation provider proof** — choose provider/caps, wire disabled-safe provider path, then prove staging flow with R2.

## 8. What this document does not authorize

- No live integration was called to produce this evaluation.
- No production or staging mutation occurred.
- No live WordPress call was made or authorized by this update; `WORDPRESS_DRAFT_PROOF.md` §6 is a plan only, and executing it requires a separate owner-approved block.
- Puriva Launch remains **blocked**. This document does not change that status; it only makes the remaining gap explicit and orderable.
- G148 integration does not authorize G149 or any execution gate.
- G228 integration does not authorize G229+ execution, live proof, or Puriva Launch. See `docs/operator/G227_NEXT_30_GATES.md` for proposed G229–G258 sequencing only.

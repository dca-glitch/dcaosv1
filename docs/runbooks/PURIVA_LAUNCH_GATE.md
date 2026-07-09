# Puriva Launch Gate — 15-Area Evaluation

**Status:** Docs-only evaluation. Overall verdict: **BLOCKED**. SEC-B1 (legacy `/api/v1/briefs` cross-tenant IDOR) **fixed locally** in mega-block 2026-07-09 — regression test added; commit pending owner approval. This document does not authorize Puriva Launch, live integrations, or production client-facing use.

**Gate separation:** Puriva Client-Service Launch Gate is independent from the DCA OS Production v1 Gate (G49 → G50). Clearing G49/G50 does **not** authorize Puriva Launch, and vice versa.

**Source of truth:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) · [`docs/architecture/CLIENT_OPERATING_PACKS.md`](../architecture/CLIENT_OPERATING_PACKS.md) · [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) · [`docs/STATUS.md`](../STATUS.md) · [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](../security/SECURITY_BOUNDARY_AUDIT.md) · [`docs/runbooks/IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md)

---

## 1. Overall verdict

**BLOCKED.** 8 of 15 evaluation areas are fully blocked pending live proof or a not-yet-started product/policy gate. 2 more areas have real local scaffolding but cannot support a live client-facing claim yet. 5 areas are genuinely usable now in local/admin-operated form only. **Security:** SEC-B1 fixed locally; SEC-H1 (`storageKey` in admin deliverable list) remains open — see security audit.

---

## 1b. Security gate (SEC-B1)

| Item | Status |
|------|--------|
| SEC-B1 legacy `/api/v1/briefs` cross-tenant IDOR | **FIXED (local, uncommitted)** — `requireTenant` + tenant-scoped client/brief checks |
| Regression test | `apps/api/tests/integration/briefs-tenant-boundary.integration.test.ts` |
| SEC-H1 admin `storageKey` exposure | **OPEN** — separate block recommended |
| Puriva launch impact | SEC-B1 was a **production safety blocker**; fix must be committed and validated before G50 |

---

## 2. 15-area evaluation

| # | Area | Verdict | Evidence / gap |
|---|------|---------|-----------------|
| 1 | GA/GSC live proof | **BLOCKED** | No live OAuth consent or sync has ever been executed. Snapshot-first manual metrics is the active local path. |
| 2 | R2/storage live proof | **BLOCKED** | Disabled-safe local behavior proven (`smoke:r2-byte-roundtrip:local`); no real bucket round-trip ever executed. See [`STORAGE_R2_PROOF.md`](./STORAGE_R2_PROOF.md). |
| 3 | Live AI text proof | **BLOCKED** | Local deterministic gateway is the proven default; OpenRouter path is coded and config-validated but never executed live. |
| 4 | Image generation provider research | **BLOCKED** | No provider selected. Full flow spec: [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md). |
| 5 | Image generation staging proof | **BLOCKED** | Depends on #4 + R2 live proof + AI Model Policy; scaffold exists (`prepare-image-sets`) but no live provider. |
| 6 | Transactional notification proof (in-system + email) | **BLOCKED** | Local outbox/in-system foundation is disabled-safe and smoke-proven (`smoke:email-outbox:local`); real email send via Resend has never been executed. |
| 7 | WordPress draft/handoff readiness | **PASS (local/operator-ready)** | Draft preparation and operator handoff smoke-proven; required scope for Puriva Launch is draft/handoff, not auto-publish, and that scope is met locally. |
| 8 | Integration health visibility | **PASS (local/admin)** / **BLOCKED (live)** | `GET /api/v1/integrations/readiness` gives admin-visible config-shape health today; there is nothing live to show health for until other live proofs close. |
| 9 | AI Model Research Gate | **BLOCKED** | Not started. |
| 10 | AI Model Policy | **BLOCKED** | Depends on #9. |
| 11 | Client Portal approval UX | **PASS (local/admin-operated MVP)** / **BLOCKED (production-proven claim)** | Approval happy-path is smoke-proven locally; no staging/production browser QA evidence exists yet. |
| 12 | Task-oriented admin UX / admin operating checklist | **PASS (local)** | Admin daily operations cockpit (Ready now / Needs review / Blocked-waiting) and Puriva operating pack checklist exist and are smoke-proven. |
| 13 | Client profiles and boundaries (medical compliance, content/tone, image profile/dimensions) | **PARTIAL — usable as documented checklist** | Per `CLIENT_OPERATING_PACKS.md` §7, profiles may start as documented operator checklists before becoming structured configuration; that is the current state — usable now as an admin discipline, not yet a database-enforced control. |
| 14 | Article + Image Package Workflow v1 | **PASS (local scaffold/workflow shape)** / **BLOCKED (full live proof)** | Step order, reject-reason, regenerate-only-rejected, upscale-after-approval, and social-preview rules are documented and largely implemented as a workflow scaffold; full proof requires live image generation (#4/#5). |
| 15 | Monthly Report Flow v1 + feedback learning layer | **PASS (local/client-safe FINAL-only report)** / **BLOCKED (live metrics + feedback learning)** | Admin report lifecycle, PDF, and client FINAL-only visibility are smoke-proven locally; live GA/GSC-sourced metrics depend on #1; a dedicated feedback-learning-notes persistence layer was not found in code this session — treat as not started, not partially built. |

---

## 3. What is usable now (admin-operated, local, not client-facing on production)

- Full local Puriva E2E operator dry-run: intake → compliance → AI Knowledge/context → WorkflowBriefs → SEO plan → content/compliance → image/asset handoff scaffold → WordPress prepared draft → client-safe monthly report/archive → client approval happy path.
- Admin daily operations cockpit with a discoverable first-client path and explicit deferred/gated labeling.
- Client Portal read-only archive and FINAL-only monthly reports, proven locally, not deployed to any client-facing production environment.
- WordPress draft/handoff preparation (no auto-publish).

## 4. What is not client-facing / remains blocked

Nothing in the Puriva delivery path may be shown to a real client on a production environment until the fully-blocked areas above (rows 1, 2, 3, 4, 5, 6, 9, 10, and the live-proof portions of 14 and 15) are closed with real evidence — not local-only or config-shape evidence.

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
3. Live AI text proof PASS (bounded, owner-approved)
4. Image generation provider selected + staging proof PASS per [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md)
5. Transactional email live proof PASS
6. GA/GSC live proof PASS (or explicit waiver documented for MVP)
7. Client portal approval UX proven on staging browser
8. WordPress draft handoff proven on staging
9. No HIGH security findings open (SEC-H1 minimum)

---

## 7. Recommended next blocks (ordered by lowest-effort-to-close-first)

1. **SEC-B1 commit + validation** — merge tenant boundary fix and regression test (this mega-block).
2. **R2 live proof** — code is fully written and unit/local-tested; only needs a real staging-only bucket + one owner-approved proof session (see `STORAGE_R2_PROOF.md` §3).
3. **AI Model Research + AI Model Policy** — policy gates that unblock sequencing for live AI text + image proof; no code changes required, just research/decision documentation.
4. **Image generation provider wiring (disabled-safe)** — per `IMAGE_GENERATION_PROOF.md` Phase B.
5. **Transactional notification proof** — send one bounded test email to an owner-controlled inbox via Resend; low blast radius.
6. **GA/GSC live proof** — requires OAuth consent screen setup; medium effort.
7. **Image generation staging proof** — highest effort; blocks Article+Image full proof; follows AI Model Policy + R2.

## 8. What this document does not authorize

- No live integration was called to produce this evaluation.
- No production or staging mutation occurred.
- Puriva Launch remains **blocked**. This document does not change that status; it only makes the remaining gap explicit and orderable.

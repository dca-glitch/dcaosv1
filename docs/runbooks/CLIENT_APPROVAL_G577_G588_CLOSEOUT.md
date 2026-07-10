# Client Approval / Revision / Notification Loop — G577–G588 Closeout

**Lane:** 10 (Client approval / revision policy / notification loop)  
**Date:** 2026-07-10  
**Baseline:** `main` @ `66dcb74`  
**Status:** Local policy + mapping + serializer hardening complete. No schema migration. No live email. No commit/push/deploy.

Related (read-only / adjacent):

- `apps/api/src/core/client-portal-approval-policy.ts`
- `apps/api/src/core/revision-policy.ts`
- `apps/api/src/core/approval-notification-mapping.ts`
- `apps/api/src/core/client-approval-serializer.ts`
- `docs/architecture/CLIENT_PORTAL_BOUNDARY.md`
- `docs/architecture/CLIENT_PORTAL_NOTIFICATIONS_PLAN.md`
- `docs/operator/notifications-blocker-plan.md` (G84 map; main-owned — proposal only below)

---

## Per-task status

| Task | Status | Notes |
|------|--------|-------|
| G577 Content approval policy tests | DONE | Expanded approve / images-pending / already-approved coverage |
| G578 Request changes policy tests | DONE | Reason required + pending-only + admin notify |
| G579 One revision round design | DONE | `revision-policy.ts` + policy integration; persistence deferred |
| G580 Image approval/reject reason policy | DONE | Reject reason helper + image action tests |
| G581 Monthly report availability notification policy | DONE | Maps to existing `monthly_report_available` (not wired) |
| G582 Admin alert after client action | DONE | Maps approve/request-changes/image-reject; undo = null |
| G583 Approval event-to-notification map | DONE | Pure map onto Lane 3 existing event names only |
| G584 Approval surface client-safe serializer | DONE | `client-approval-serializer.ts`; runtime list/detail reuse |
| G585 Approval docs closeout | DONE | This runbook + boundary note |
| G586 Deferred schema proposal | DONE | Proposal only (below) |
| G587 Launch blocker update proposal | DONE | Proposal only (below) |
| G588 Lane validation | DONE | Focused unit tests only (no full validate) |

---

## Files touched (Lane 10)

### Owned / edited

- `apps/api/src/core/client-portal-approval-policy.ts`
- `apps/api/src/core/client-portal-approval-policy.test.ts`
- `apps/api/src/core/client-portal-approval.runtime.ts`
- `apps/api/src/core/client-portal-approval.runtime.test.ts`
- `apps/api/src/controllers/client-portal-approval.controller.ts` (policy error codes only; no RBAC weaken)

### New

- `apps/api/src/core/revision-policy.ts`
- `apps/api/src/core/revision-policy.test.ts`
- `apps/api/src/core/approval-notification-mapping.ts`
- `apps/api/src/core/approval-notification-mapping.test.ts`
- `apps/api/src/core/client-approval-serializer.ts`
- `apps/api/src/core/client-approval-serializer.test.ts`
- `docs/runbooks/CLIENT_APPROVAL_G577_G588_CLOSEOUT.md` (this file)

### Intentionally not edited

- `image-approval-loop*` (Lane 8)
- `client-portal.runtime*` (Lane 9)
- `packages/shared/src/notification-events.ts` (Lane 3)
- Main-owned: `docs/STATUS.md`, `docs/operator/deferred-scope-register.md`, `docs/runbooks/PURIVA_LAUNCH_GATE.md`, `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`

---

## Behavior summary

1. **Content approve** — pending + all images reviewed (or no images) → `APPROVED_BY_CLIENT`, admin notify via existing `AI_DELIVERY_APPROVED` / taxonomy `content_approved`.
2. **Request changes** — pending + non-empty reason + revision round available → `DRAFT`, admin notify via `AI_DELIVERY_REVIEW_REQUEST` / `content_changes_requested`.
3. **One revision round** — pure policy enforces exhaustion; runtime still passes `revisionRoundUsed: false` until durable field exists.
4. **Image reject** — reason required; image approve/reject still do not send email (map documents gap).
5. **Monthly report availability** — policy maps FINAL → `monthly_report_available`; client delivery path remains unwired.
6. **Serializer** — pending/detail surfaces strip forbidden keys; legacy detail response omits `revisionRoundAvailable` until UI opts in.

Controller hardening (safe): empty reject reasons → `CLIENT_APPROVAL_REASON_REQUIRED`; future exhaustion → `CLIENT_APPROVAL_REVISION_ROUND_EXHAUSTED`. Owner/admin still cannot use client approval mutation helpers.

---

## G586 — Deferred schema proposal (DO NOT APPLY)

Propose for a future owner-approved migration block only:

| Item | Proposal |
|------|----------|
| Model | `AiDeliveryDeliverable` |
| Field | `clientRevisionRoundUsed Boolean @default(false)` |
| Reset | Set `false` in `sendAiDeliveryDeliverableForClientReview` |
| Set true | On successful `rejectClientPortalDeliverable` / request-changes |
| Enforce | Pass `revisionRoundUsed: deliverable.clientRevisionRoundUsed` into `evaluateClientPortalApprovalAction` |
| Alternate | Small int `clientRevisionRoundCount` with limit `1` |

Also deferred (notifications, not schema in this lane):

- In-system notification / inbox persistence (N1–N3)
- Image-level email intent wiring for approve/reject
- Client delivery of `monthly_report_available` on FINAL

**No Prisma migration was created or run in G577–G588.**

---

## G587 — Launch blocker update proposal (for main agent)

Propose additive notes for main-owned docs (do not apply from this lane):

### `docs/operator/deferred-scope-register.md`

Add/refresh row:

> **Client approval revision round persistence** — Pure policy + API error codes ready (G335 / G577–G588). Durable `clientRevisionRoundUsed` (or equivalent) deferred pending schema approval. Runtime still cannot exhaust the round across requests.

### `docs/runbooks/PURIVA_LAUNCH_GATE.md`

Keep Puriva Launch **BLOCKED**. Suggested blocker board bullets:

1. Durable one-revision-round counter not persisted (policy-only).
2. Image-level client approve/reject has no notification intent (map exists; runtime unwired).
3. Monthly report FINAL → client `monthly_report_available` path unwired.
4. In-system inbox / live email proof still owner-gated (N1–N3).

### `docs/STATUS.md`

Optional status line:

> **G577–G588** — Client approval policy/revision/notification-map/serializer hardening: local COMPLETE (no schema, no live send).

---

## Validation (G588)

Focused only (no full `validate`):

```powershell
cd C:\dcaosv1
node --import tsx --test apps/api/src/core/client-portal-approval-policy.test.ts
node --import tsx --test apps/api/src/core/revision-policy.test.ts
node --import tsx --test apps/api/src/core/approval-notification-mapping.test.ts
node --import tsx --test apps/api/src/core/client-approval-serializer.test.ts
node --import tsx --test apps/api/src/core/client-portal-approval.runtime.test.ts
```

---

## Confirmations

- No commit / push / deploy
- No schema migration
- No RBAC weakening
- No live email / provider calls
- `.cursor/settings.json` untouched
- Lane 3 / 8 / 9 owned files not edited

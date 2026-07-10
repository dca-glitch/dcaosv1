# Notifications Blocker Plan (G78)

**Status:** Planning only — docs block G78 (2026-07-10). No notification code implemented in this block.

**Purpose:** Staged plan for transactional notifications required before Puriva Launch and before claiming production-proven client-facing approval flows. Consolidates scattered docs into one operator-facing sequence.

**Related (source of truth by layer):**

- Puriva policy: [`docs/architecture/G52_OWNER_DISPOSITION.md`](../architecture/G52_OWNER_DISPOSITION.md) §9.3, [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md)
- Email pathway audit + live Resend proof plan: [`docs/runbooks/EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md)
- EN1/EN2 backend contract: [`docs/email-notifications-contract.md`](../email-notifications-contract.md)
- Integration truth: [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)
- Launch gate row 6: [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md)
- Deferred register: [`docs/operator/deferred-scope-register.md`](./deferred-scope-register.md)

---

## Executive verdict

**Notifications remain a Puriva Launch blocker and a production blocker for client-facing approval flows.**

| Claim | Allowed today? | Why not |
|-------|----------------|---------|
| Local admin-operated approval UX in Client Portal | **Yes** | Happy-path smokes pass; client can approve/reject when they open the portal |
| Production-proven client-facing approval workflow | **No** | No proven delivery channel tells the client *when* to act |
| Puriva monthly report client delivery | **No** | Pack requires step 9: in-system + email to client on FINAL — neither channel is proven |
| Relying on phone / WhatsApp / manual email from admin | **No** | Explicitly insufficient for launch (see §Manual communication is not a substitute) |

Local portal UX ≠ notification readiness. Approval surfaces exist; **reliable, auditable, system-delivered prompts do not.**

---

## Current implementation snapshot (2026-07-10)

### What exists

| Layer | Implementation | Proven? |
|-------|------------------|---------|
| **Email attempt log** | `EmailLog` + `sendEmailNotification()` — local default `SKIPPED`; Resend path when keyed | Disabled-safe only (`smoke:email-outbox:local`) |
| **Internal AI Delivery events** | `recordAiDeliverySystemEvent()` — always `SKIPPED`, placeholder recipient | Admin outbox rows only |
| **Real-path email wiring** | `notifyDcaTeam` / `notifyClientUsers` on approve/reject, send-for-review, article ready, image FINAL_READY, monthly report FINAL, WordPress draft prepared (2026-07-09 wiring block) | Integration tests + disabled-safe smokes; **no live inbox proof** |
| **Platform audit** | `AuditLog` — auth, tenant, module actions; AI Delivery lifecycle mostly via internal-event path | Local operator visibility; not a user notification inbox |
| **Orchestrator dry-run events** | G61 `AiNotificationEventType` + in-memory no-send recorder on orchestrator preview | Dry-run only; not Client Portal or admin daily inbox |
| **Admin email outbox API** | `GET /api/v1/notifications/email-logs` (admin/owner, tenant-scoped) | Read-only smoke proven |

### What does not exist

- User-scoped **in-app notification** model, API, or Client Portal / admin UI feed (no bell, unread count, or per-user inbox).
- Live transactional email send proof (Resend never executed in a controlled proof session).
- Client-visible notification when deliverable/report is ready — client must poll `#/client-portal/pending-approvals` or be contacted manually.
- Background queues, retry/deliverability monitoring, or invite/password-reset email (all deferred).
- Dedicated `EmailTemplateKey` values for ready/final/draft-prepared (reuse of generic keys today; dedicated keys need schema approval).

### Doc consistency note

[`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) §2 event table reflects 2026-07-09 real-path wiring; §2 summary paragraph, §7, and §8 gap list are **stale** relative to STATUS mega-block closeout and INTEGRATIONS_TRUTH_MATRIX. Treat §1–§2 table + STATUS §Email + R2 combined block as wiring truth; refresh EMAIL_NOTIFICATIONS_PROOF §7–§8 in a future docs-only pass.

---

## Manual communication is not a substitute

**Phone calls, WhatsApp, ad-hoc personal email, or "we'll tell the client verbally" do not satisfy Puriva Launch notification requirements.**

Approved policy ([`G52_OWNER_DISPOSITION.md`](../architecture/G52_OWNER_DISPOSITION.md) §9.3):

- Transactional workflow notifications (approvals, report delivery, admin alerts) require **in-system + email** proof before launch.
- SMS / WhatsApp remain deferred and are **not** approved launch channels.

Operational reasons manual-only fails:

1. **No audit trail** tied to tenant/client/event in DCA OS (who was told what, when).
2. **No client self-service** — violates the operating pack assumption that the system prompts action.
3. **Single point of failure** — operator availability becomes the notification system.
4. **Production claim blocked** — [`PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md) area 6 and area 11 (production-proven approval UX) both require system-delivered channels.

Manual follow-up may supplement notifications; it **cannot replace** them for launch or production approval-flow claims.

---

## Staged plan

Execute as separate owner-approved blocks. Order is dependency-safe: event source → in-system MVP → email MVP → event coverage → audit alignment → live proof.

### Stage 0 — Internal event source (foundation; largely present)

**Goal:** Every notification-worthy transition emits one canonical internal event before any channel fan-out.

| Source | Role | Status |
|--------|------|--------|
| Domain handlers (AI Delivery, briefs, client portal approval, monthly report, WordPress draft prep) | Emit on state transition | Real-path calls present for Puriva taxonomy (post-2026-07-09); verify with `email-notification-wiring.integration.test.ts` |
| `recordAiDeliverySystemEvent()` | Low-noise lifecycle log to `EmailLog` (never sends) | Active for bulk CRUD events |
| `AuditLog` | Compliance-grade platform audit (actor, entity, metadata) | Active for platform actions; extend selectively for high-value client/admin events if product requires audit without email |
| G61 `AiNotificationEventType` | Orchestrator/budget blocked events | Dry-run only |

**Stage 0 exit criteria:**

- Event taxonomy row (§Event taxonomy) maps 1:1 to a code trigger and at least one `EmailLog` or `AuditLog` row in disabled-safe local proof.
- No duplicate ad-hoc notification calls outside `notifyDcaTeam` / `notifyClientUsers` / `recordAiDeliverySystemEvent`.

**Deferred in Stage 0:** Schema migration for new `EmailTemplateKey` enum values (owner/schema gate).

---

### Stage 1 — In-system notification MVP

**Goal:** Authenticated users see unread/read transactional alerts inside DCA OS — independent of email delivery.

**Minimum scope (MVP):**

| Surface | Audience | MVP behavior |
|---------|----------|--------------|
| Client Portal | Client users with `ClientUserAccess` | List + detail link for: deliverable ready for review, image set ready (when applicable), monthly report FINAL published |
| Admin shell | Tenant owner/admin | List + detail link for: client approved/rejected, brief submitted, admin action required, article/image ready, monthly report FINAL, WordPress draft prepared |

**Technical direction (planning only — not implemented):**

- Persist user-scoped notification rows (new model or approved reuse pattern — **not** `EmailLog` alone; that table is outbound-attempt log, admin-only today).
- Write on same triggers as Stage 0; mark read on portal visit or explicit ack.
- Tenant + client isolation enforced; no internal fields in client payload.
- Disabled-safe default: notifications created locally without requiring Resend.

**Stage 1 exit criteria:**

- Local smoke: client receives in-system row when admin sends deliverable for review; admin receives row on client approve/reject.
- Client portal shows notification indicator or pending-approvals entry without manual admin contact.
- No dependency on live email for Stage 1 proof.

---

### Stage 2 — Email notification MVP

**Goal:** Same event taxonomy delivers transactional email when provider is enabled; remains disabled-safe when not.

**Minimum scope:**

| Config | Behavior |
|--------|----------|
| `EMAIL_PROVIDER=local` (default) | `EmailLog.status=SKIPPED`; in-system still works (Stage 1) |
| `EMAIL_PROVIDER=resend` + staging key | Single bounded proof to owner inbox per [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) §4 |
| Production | Only after staging proof + explicit owner approval; never first send to real client address |

**Recipients (existing patterns):**

- Admin alerts → tenant owner/admin users + `EMAIL_REPLY_TO`
- Client review prompts → `ClientUserAccess` emails for scoped client
- Monthly report FINAL → client emails (no approval flow; informational delivery per Puriva pack)

**Stage 2 exit criteria:**

- One owner-controlled live proof: `SENT` row + matching inbox receipt + restore to local provider.
- Fan-out smokes for `notifyDcaTeam` / `notifyClientUsers` in staging with test fixtures only.
- `smoke:email-outbox:local` still PASS after restore.

---

### Stage 3 — Client approval events

**Goal:** End-to-end client approval loop is system-delivered, not poll-only.

| Event | In-system (client) | Email (client) | In-system (admin) | Email (admin) |
|-------|-------------------|----------------|---------------------|---------------|
| Deliverable / article sent for client review | Required | Required | Optional ack | Optional |
| Image set ready for client review | Required | Required | — | Notify admin on FINAL_READY (existing wiring) |
| Client approved | — | — | Required | Required (`AI_DELIVERY_APPROVED`) |
| Client rejected / changes requested | — | — | Required | Required (`AI_DELIVERY_REVIEW_REQUEST`) |

**Coverage gaps to close before staging/production claim:**

- Image-set reject/undo paths: endpoints exist; notification + smoke coverage missing ([`PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md) §2b).
- Article "Request changes" via browser automation not proven (API-only today).

**Stage 3 exit criteria:**

- Staging browser proof: admin sends for review → client in-system + email → client approves → admin in-system + email.
- No production claim without both channels proven on staging.

---

### Stage 4 — Admin alert events

**Goal:** Operators are not required to watch AI Delivery screens continuously.

| Event | Admin in-system | Admin email |
|-------|-----------------|-------------|
| Brief submitted | Required | Required |
| Content draft/plan review requested | Required | Wired (verify template copy) |
| Article ready for admin review | Required | Wired |
| Image set FINAL_READY | Required | Wired |
| Client approved / rejected | Required | Wired |
| Monthly report → FINAL | Required | Wired |
| WordPress draft prepared | Required | Wired |
| Budget/orchestrator block (G61) | Optional dashboard | Deferred unless operator requests |

**Stage 4 exit criteria:**

- Admin daily cockpit or notification list surfaces unread admin alerts.
- Each row links to the correct admin route (`#/ai-delivery`, monthly reports, etc.).

---

### Stage 5 — Audit logging alignment

**Goal:** Separate **user notifications** from **compliance audit** without duplication confusion.

| Concern | System of record | Rule |
|---------|------------------|------|
| "Did we try to email the client?" | `EmailLog` | One row per send attempt; statuses `SKIPPED` / `SENT` / `FAILED` |
| "Who changed what in the platform?" | `AuditLog` | Actor, entity, metadata; not a substitute for user inbox |
| "Did the user see an alert?" | In-system notification MVP (Stage 1) | Read/unread state; not inferred from email alone |

**Recommended audit extensions (small, optional blocks):**

- `client_portal.deliverable_approved` / `client_portal.deliverable_rejected` on `AuditLog` if not already emitted alongside email.
- Monthly report FINAL transition audit row with client notification correlation id.

**Stage 5 exit criteria:**

- Operator runbook states which table to query for delivery vs audit vs inbox.
- No secret values in any notification API response (existing smoke invariant).

---

## Event taxonomy (Puriva launch minimum)

| # | Business event | Primary trigger (conceptual) | Client channels | Admin channels |
|---|----------------|------------------------------|-----------------|----------------|
| 1 | Article / deliverable ready for client review | Send for client review | In-system + email | In-system + email (optional) |
| 2 | Image set ready for client review | Image FINAL_READY + send path | In-system + email | In-system + email |
| 3 | Client approved | Client portal approve | — | In-system + email |
| 4 | Client rejected / changes requested | Client portal reject | — | In-system + email |
| 5 | Admin action required | Brief submitted; review requested | — | In-system + email |
| 6 | Monthly report FINAL | Report status → FINAL | In-system + email (informational) | In-system + email |
| 7 | WordPress draft prepared | Draft prep complete | — | In-system + email |

Marketing campaigns, invite email, password reset, SMS/WhatsApp: **out of scope** — remain deferred.

---

## Suggested gate sequence (for DCA MODE)

| Gate | Scope | Depends on |
|------|-------|------------|
| **N0** | Docs refresh — reconcile EMAIL_NOTIFICATIONS_PROOF §7–§8 with 2026-07-09 wiring | G78 |
| **N1** | In-system notification MVP (schema + API + client/admin UI) | N0 |
| **N2** | Email live proof — bounded Resend to owner inbox | [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) §4 |
| **N3** | Staging: full client approval loop (both channels) | N1 + N2 |
| **N4** | Optional: dedicated template keys (schema migration) | Owner approval |

Puriva Launch area 6 closes only after **N1 + N2 + N3** with evidence. Area 11 production-proven approval UX closes with **N3**.

---

## Validation needed (when implementation blocks run)

| Check | Command / proof |
|-------|-----------------|
| Disabled-safe email baseline | `npm.cmd run smoke:email-outbox:local` |
| Email wiring integration | `email-notification-wiring.integration.test.ts` (via `npm.cmd run validate`) |
| Client approval happy path (no notification claim) | `node scripts/smoke-client-approval-happy-path-local.mjs` |
| Live Resend proof | Owner session per EMAIL_NOTIFICATIONS_PROOF §4; log to `$env:TEMP\email-live-resend-proof-<date>.log` |
| In-system MVP (future) | New smoke: client + admin unread notification on send-for-review and approve |
| Staging approval + notification (future) | Browser smoke on staging with explicit target env guards |
| Secret safety | No `RESEND_API_KEY`, session hashes, or raw keys in API responses or docs |

**G78 validation:** Docs-only — no runtime validation required for this block.

---

## Risk notes

| Risk | Severity | Mitigation |
|------|----------|------------|
| First live send to real client without proof | High | Bounded owner-inbox proof first; restore `EMAIL_PROVIDER=local` immediately after |
| Treating `EmailLog` as in-system inbox | Medium | Stage 1 requires user-scoped notification store; document separation in Stage 5 |
| Stale EMAIL_NOTIFICATIONS_PROOF §7–§8 misleads planners | Medium | N0 docs refresh; this plan supersedes for G78 sequencing |
| Manual WhatsApp/phone as workaround | High | Explicitly rejected for launch claims (§Manual communication) |
| Template key reuse causes wrong email copy | Low | Accept for MVP; N4 migration if needed |
| Client never opens portal without email | High | Stage 2 required for production; Stage 1 alone insufficient for launch |

---

## Out of scope (remain deferred)

- Marketing / newsletter email
- SMS / WhatsApp
- Invite and password-reset email
- Background queues and retry workers
- Public / magic-link approval notifications
- SIEM or compliance-grade notification archiving beyond existing `AuditLog`

---

*G78 — Subagent D — planning only. Backend/API/schema/auth not modified in this block.*

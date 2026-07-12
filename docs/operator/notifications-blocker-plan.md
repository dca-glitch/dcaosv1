# Notifications Blocker Plan (G78, refreshed G82-G84, G94-G102, G159–G170, G249–G268, G493–G504)

**Status:** Updated 2026-07-11: local v1 inbox persistence is implemented (schema + API + shell panel). Live email proof and staging/production delivery proof remain blocked until owner-gated execution.

**Purpose:** Staged plan for transactional notifications required before Puriva Launch and before claiming production-proven client-facing approval flows. Consolidates scattered docs into one operator-facing sequence.

**Related (source of truth by layer):**

- Puriva policy: [`docs/architecture/G52_OWNER_DISPOSITION.md`](../architecture/G52_OWNER_DISPOSITION.md) §9.3, [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md)
- Email pathway audit + live Resend proof plan: [`docs/runbooks/EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md)
- EN1/EN2 backend contract: [`docs/email-notifications-contract.md`](../email-notifications-contract.md)
- Taxonomy closeout: [`docs/runbooks/NOTIFICATION_TAXONOMY_G493_G504_CLOSEOUT.md`](../runbooks/NOTIFICATION_TAXONOMY_G493_G504_CLOSEOUT.md)
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

## Current implementation snapshot (2026-07-11)

### What exists

| Layer | Implementation | Proven? |
|-------|------------------|---------|
| **Email attempt log** | `EmailLog` + `sendEmailNotification()` — local default `SKIPPED`; Resend path when keyed | Disabled-safe only (`smoke:email-outbox:local`) |
| **Internal AI Delivery events** | `recordAiDeliverySystemEvent()` — always `SKIPPED`, placeholder recipient | Admin outbox rows only |
| **Real-path email wiring** | `notifyDcaTeam` / `notifyClientUsers` on approve/reject, send-for-review, article ready, image FINAL_READY, monthly report FINAL, WordPress draft prepared (2026-07-09 wiring block) | Integration tests + disabled-safe smokes; **no live inbox proof** |
| **Platform audit** | `AuditLog` — auth, tenant, module actions; AI Delivery lifecycle mostly via internal-event path | Local operator visibility; not a user notification inbox |
| **Orchestrator dry-run events** | G61 `AiNotificationEventType` + in-memory no-send recorder on orchestrator preview | Dry-run only; not Client Portal or admin daily inbox |
| **No-schema notification foundation** | G94-G102 / G159–G170 / G249–G268 / G493–G504 `notification-events` shared taxonomy (expanded + families), recipient/channel/severity policy, payload redaction + safe snapshots, event metadata + audit safe shape, typed template catalog, approval/reject matrix, audit metadata builder, legacy alias map, correlation/idempotency design helpers, schema-safe template inventory, API no-send email adapter (edge-tested) | Pure unit tests; no live email |
| **In-app inbox (local v1)** | Prisma `InAppNotification` + `in-app-notifications.service.ts` (upsert/list/mark-read) + admin/client APIs + shell notification panel; `payloadJson` redacted on write | Local persistence implemented; approval-loop event coverage + staging/prod delivery still incomplete |
| **Persistence design doc** | [`notification-persistence-design.md`](./notification-persistence-design.md) | **Historical** for pre-implementation planning; superseded by local v1 inbox above |
| **Admin email outbox API** | `GET /api/v1/notifications/email-logs` (admin/owner, tenant-scoped) | Read-only smoke proven |
| **No-send notification tests** | `email-notification-wiring.integration.test.ts` checks disabled-safe outbox and content draft admin notification intent when local auth seed is available | Partial; does not prove every approval-loop event |

### What does not exist (remaining blockers)

- Live transactional email send proof (Resend never executed in a controlled proof session).
- Complete approval-loop coverage that always writes user-scoped in-app rows for every launch-critical event (model/API exist; not every path is wired).
- Client email/notification delivery for monthly report `FINAL` proven to a real inbox; current code emits admin notification intent only in local no-send mode.
- Notification intent on image-level client approve/reject rows; current code records image review status/reason only.
- Background queues, retry/deliverability monitoring, or invite/password-reset email (all deferred).
- Dedicated `EmailTemplateKey` values for ready/final/draft-prepared (reuse of generic keys today; dedicated keys need schema approval).
- Staging/production delivery proof for in-app + email channels.

### G94-G102 / G159–G170 / G249–G268 / G493–G504 no-schema foundation

Shared taxonomy and no-send adapters remain the contract layer above persistence:

- `packages/shared/src/notification-events.ts` (`NOTIFICATION_EVENTS_V2` + `NOTIFICATION_TAXONOMY_G493_G504_V1`) defines the expanded G159 launch/ops event taxonomy, event families (G495), coverage audit (G493), legacy alias map (G250/G494), recipient policy (G160/G251/G498), channel policy (G161/G252/G498), severity (G162/G253/G498), payload redaction (G163/G254/G497), payload snapshots (G255/G497), event metadata builder (G499), audit safe shape (G500), typed template catalog (G166/G261), approval/reject matrix, audit metadata builder (G256), and schema-safe email template inventory.
- `apps/api/src/notifications/email-no-send-adapter.ts` (`EMAIL_NO_SEND_ADAPTER_V2`) records skipped attempts, never calls an external provider, needs no API key, redacts payloads, optionally redacts recipients in log metadata, and treats missing templates as safe no-send (G165/G260–G263). Owned by Lane 4.
- `apps/api/src/notifications/notification-correlation.ts` defines correlation/idempotency design keys only (G257/G496).
- `apps/api/src/config/email.config.ts` exposes a serializable safety shape that separates "Resend is configured" from "live email proof is complete" (G264). Owned by Lane 4.
- Local v1 persistence service: `apps/api/src/notifications/in-app-notifications.service.ts` (redact on write). Historical design: [`notification-persistence-design.md`](./notification-persistence-design.md).
- Taxonomy closeout runbook: [`../runbooks/NOTIFICATION_TAXONOMY_G493_G504_CLOSEOUT.md`](../runbooks/NOTIFICATION_TAXONOMY_G493_G504_CLOSEOUT.md).

**Important blocker remains:** live email stays blocked until the owner-approved Resend proof in [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) is executed. In-app model exists locally; launch still requires proven event→inbox wiring and live email proof.

### G82-G84 consistency note

[`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) now separates current disabled-safe wiring from remaining launch blockers. Treat the code-backed facts as:

- Real-path email intent exists for several admin/client events, but default local mode is still no-send (`SKIPPED`).
- Local v1 in-app notification model/API/panel exist; not every approval-loop path is proven to write inbox rows.
- Monthly report `FINAL` is not client-delivered by live email today.
- Image-level approve/reject is not notification-wired today.
- Phone/manual-only remains insufficient for Puriva Launch.

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

## G82 — Internal Events / Audit Inspection

**Finding (historical G82):** at the time of G82 there was no in-system notification model. **Update (2026-07-11):** local v1 `InAppNotification` persistence + inbox APIs exist. G82 table below remains useful for distinguishing audit/email logs from the inbox.

| Existing mechanism | What it proves | What it does not prove |
|--------------------|----------------|-------------------------|
| `EmailLog` via `sendEmailNotification()` | Outbound email intent and provider result (`SKIPPED` / `SENT` / `FAILED`) | User inbox, unread state, client/admin UI delivery |
| `InAppNotification` via `in-app-notifications.service.ts` | User-scoped unread/read inbox rows (local v1) | Live email delivery; complete approval-loop wiring coverage |
| `recordAiDeliverySystemEvent()` | Internal AI Delivery lifecycle event row, always `SKIPPED`, never sends | Real email or complete client/admin delivery proof |
| `AuditLog` via `recordPlatformAuditEvent()` | Platform/audit trail for selected actions | User notification, email delivery, or read receipt |
| `recordAiNotificationEvent()` / `AiNotificationEventType` | In-memory no-send event taxonomy for orchestrator/budget previews | Approval-loop delivery completeness |

**G82 recommendation (updated):** keep taxonomy + no-send seams; finish wiring launch-critical events into `InAppNotification`; execute owner-gated live email proof separately.

---

## G83 — Email No-Send Proof

**Checklist source:** [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) §3.6.

Current no-send proof is partial:

- Existing email provider config test proves fail-safe local provider behavior without network or DB.
- Existing email wiring integration test proves `GET /notifications/email-logs` hides secrets and content draft review can create `SKIPPED` admin notification intent when local auth seed is available.
- No new G83 runtime test was added because this block stayed docs-only and the current code already has a no-send service seam.

Required before launch claim:

- Disabled-safe proof for each mapped event row below, with `EmailLog.status=SKIPPED` in local mode.
- Secret-safety assertion on any notification API response used as evidence.
- A separate owner-approved live Resend proof to one owner-controlled inbox before any client-facing send.

---

## G84 — Client Approval Notification Loop Map

This is the exact current map as of G82-G84 inspection. "Wired" means code records email notification intent through the existing service path; in local mode this is still no-send (`SKIPPED`), not a live inbox proof.

| Loop event | Current code trigger | Client channel today | Admin channel today | Gap / next action |
|------------|----------------------|----------------------|---------------------|-------------------|
| Content sent for client approval | `sendAiDeliveryDeliverableForClientReview()` → `notifyClientUsers()` | Email intent to `ClientUserAccess` users; in-app row wiring not proven for this path | None beyond normal operator action | Ensure in-app client notification row on send-for-review; live email proof still needed |
| Client content approval | `approveClientPortalDeliverable()` → `notifyDcaTeam(..., AI_DELIVERY_APPROVED)` | None | Email intent to owner/admin users + reply-to | Ensure admin in-app notification; no live email proof yet |
| Client content request changes | `rejectClientPortalDeliverable()` → `notifyDcaTeam(..., AI_DELIVERY_REVIEW_REQUEST)` with reason body | None | Email intent to owner/admin users + reply-to; reason included | Ensure admin in-app notification; prove reason is safe and present |
| Image approved by client | `approveClientPortalDeliverableImage()` | None | None | Add optional admin alert if product requires image-level operator action |
| Image rejected by client with reason | `rejectClientPortalDeliverableImage()` stores `rejectionReason` | None | None | Add admin alert/no-send test if image-level rejection should interrupt workflow |
| Monthly report `FINAL` | `updateAiDeliveryMonthlyReportStatus()` when status becomes `FINAL` → `notifyDcaTeam(..., approved=true)` | None | Email intent to owner/admin users + reply-to | Add client delivery notification/email path; do not claim report client delivery yet |
| Admin alert after client action | Covered for final deliverable approve/reject only | Not applicable | Email intent for deliverable approve/reject | Missing image-level admin alert and proven in-app admin notification coverage |

**G84 verdict:** approval-loop email intent exists for deliverable-level client action and client review prompt, but the loop is not launch-complete because in-app event→inbox wiring coverage is incomplete, live email is unproven, image-level review actions do not notify, and monthly report `FINAL` is not client-delivered. (Local `InAppNotification` model/API exist; do not equate model presence with full loop proof.)

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
| G94-G102 / G159–G170 `NotificationEventType` | Launch + ops notification taxonomy and policy | Pure mapping/policy only; no DB persistence |

**Stage 0 exit criteria:**

- Event taxonomy row (§Event taxonomy) maps 1:1 to a code trigger and at least one `EmailLog` or `AuditLog` row in disabled-safe local proof.
- No duplicate ad-hoc notification calls outside `notifyDcaTeam` / `notifyClientUsers` / `recordAiDeliverySystemEvent`.

**G94-G102 / G159–G170 / G249–G268 / G493–G504 progress:** expanded taxonomy, event families, coverage audit, recipient/channel/severity policy, redaction, payload snapshots, event metadata + audit safe shape, typed template catalog, approval/reject matrix, audit metadata shape, legacy alias map, correlation/idempotency design, no-send adapter edge coverage, and persistence/inbox design docs are complete. Runtime persistence is still deferred.

**Deferred in Stage 0:** Schema migration for new `EmailTemplateKey` enum values (owner/schema gate) and user-scoped in-system notification persistence (see G167 design).

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
- Monthly report FINAL → currently admin email intent only; client email remains required for Puriva pack delivery

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
| Client image approved | Optional | Optional | Optional if operator action required | Missing today |
| Client image rejected with reason | Optional | Optional | Required if rejection should interrupt workflow | Missing today |
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
| Monthly report → FINAL | Required | Wired for admin only; client delivery missing |
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
| 1 | Article / deliverable ready for client review | Send for client review | Email intent wired; in-system missing; live proof missing | Optional admin ack missing |
| 2 | Image set ready for client review | Image FINAL_READY + send path | In-system + client email missing | Admin email intent wired on FINAL_READY; in-system missing |
| 3 | Client approved | Client portal approve | — | Admin email intent wired; in-system missing; live proof missing |
| 4 | Client rejected / changes requested | Client portal reject | — | Admin email intent wired with reason; in-system missing; live proof missing |
| 5 | Client image approved/rejected | Client portal image review | — | Missing today unless final deliverable is later approved/rejected |
| 6 | Admin action required | Brief submitted; review requested | — | Several admin email intents wired; in-system missing |
| 7 | Monthly report FINAL | Report status → FINAL | Missing today; required informational delivery | Admin email intent wired; in-system missing |
| 8 | WordPress draft prepared | Draft prep complete | — | Admin email intent wired; in-system missing |

Marketing campaigns, invite email, password reset, SMS/WhatsApp: **out of scope** — remain deferred.

---

## Suggested gate sequence (for DCA MODE)

| Gate | Scope | Depends on |
|------|-------|------------|
| **N0** | Docs refresh — keep EMAIL_NOTIFICATIONS_PROOF aligned with current disabled-safe wiring and remaining launch blockers | G78; refreshed G82-G84 |
| **N0.5** | No-schema notification foundation — taxonomy, mapping, channel policy, approval/reject matrix, audit metadata, no-send adapter, template inventory | G94-G102 complete |
| **N0.6** | Expanded taxonomy + recipient/severity/redaction + typed templates + no-send edge tests + persistence/inbox design | G159–G170 complete |
| **N0.7** | Taxonomy completeness/compat, payload snapshots, correlation/idempotency design, email config/adapter hardening | G249–G268 complete |
| **N0.8** | Taxonomy coverage audit, event families, metadata/audit safe shapes, docs closeout | G493–G504 complete (this refresh) |
| **N1** | In-system notification MVP (schema + API + client/admin UI) per `notification-persistence-design.md` | N0 + schema approval |
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

**G94-G102 / G159–G170 / G249–G268 / G493–G504 focused validation:** `node --import tsx --test apps/api/src/notifications/notification-events.test.ts` from repo root (taxonomy lane). Do not include Lane 4 email-no-send / email.config tests in this lane's focused run unless coordinating with Lane 4.

**G78 validation:** Docs-only — no runtime validation required for that block.

---

## Risk notes

| Risk | Severity | Mitigation |
|------|----------|------------|
| First live send to real client without proof | High | Bounded owner-inbox proof first; restore `EMAIL_PROVIDER=local` immediately after |
| Treating `EmailLog` as in-system inbox | Medium | Stage 1 requires user-scoped notification store; document separation in Stage 5 |
| Notification docs drift as wiring changes | Medium | Keep G82-G84 map and EMAIL_NOTIFICATIONS_PROOF gaps aligned in each scoped notification block |
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

*G78/G82-G84 — planning only. G94-G102, G159–G170, G249–G268, and G493–G504 added/expanded pure notification foundation modules, tests, correlation/idempotency design, event families/metadata/audit safe shapes, and persistence/inbox design docs. Backend runtime flows, schema/auth, live email, VPS, deploy were not modified in this block.*

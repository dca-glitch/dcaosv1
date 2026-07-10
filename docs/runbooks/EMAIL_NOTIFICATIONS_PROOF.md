# Email Notifications Proof

**Status:** Audit + wiring block (2026-07-09), refreshed by G94-G102 no-schema notification foundation (2026-07-10). Local disabled-safe wiring improved for Puriva launch events; live Resend proof remains owner-gated. No live email was sent in these blocks.

**Scope:** Audit the current transactional email/notification subsystem, define the event taxonomy requested for Puriva launch (article ready, image set ready, client approved/rejected, admin action required, monthly report final, WordPress draft prepared), confirm disabled-safe local mode, and lay out a bounded live-Resend proof plan for a future owner-approved session. This document does **not** authorize a live send.

Related:

- [`docs/email-notifications-contract.md`](../email-notifications-contract.md) (EN1/EN2 backend contract — source of truth for schema/status semantics)
- [`POST_MVP_BLOCK_38_EMAIL_OUTBOX_READ_ONLY_LOCAL_GATE.md`](./POST_MVP_BLOCK_38_EMAIL_OUTBOX_READ_ONLY_LOCAL_GATE.md)
- [`PHASE_F_BLOCK_75_EMAIL_EN2_LITE.md`](./PHASE_F_BLOCK_75_EMAIL_EN2_LITE.md)
- [`WORDPRESS_DRAFT_PROOF.md`](./WORDPRESS_DRAFT_PROOF.md) (WordPress draft-prep boundary; notification gap cross-referenced in §3.6 below)
- [`INTEGRATIONS_TRUTH_MATRIX.md`](./INTEGRATIONS_TRUTH_MATRIX.md) (Email / notifications row)
- [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) (§2 row 6, §6 item 5, §7 item 5)
- Code: `apps/api/src/config/email.config.ts`, `apps/api/src/services/email-notifications.service.ts`, `apps/api/src/services/system-events.service.ts`, `apps/api/src/core/client-portal-approval.runtime.ts`, `apps/api/src/routes/briefs.ts`, `apps/api/src/controllers/coreController.ts`
- Schema: `packages/data/prisma/schema.prisma` (`EmailLog`, `EmailStatus`, `EmailTemplateKey`)
- Smoke: `scripts/smoke-email-outbox-local.mjs` (`npm run smoke:email-outbox:local`)
- No-schema notification foundation tests: `apps/api/src/notifications/notification-events.test.ts`, `apps/api/src/notifications/email-no-send-adapter.test.ts`, `apps/api/src/config/email.config.test.ts`

---

## 1. Current implementation audit

### 1.1 Two distinct pathways exist today

| Pathway | Function | Can ever call a live provider? | Recipient model | Status written |
|---|---|---|---|---|
| "Real" outbound path | `sendEmailNotification()` in `email-notifications.service.ts` | **Yes** — only when `EMAIL_PROVIDER=resend` **and** `RESEND_API_KEY` is set; otherwise always non-sending | Real user/admin email addresses (tenant owners/admins, `ClientUserAccess` emails, `config.replyTo`) | `SKIPPED` (local), `FAILED` (resend, no key), `SENT`/`FAILED` (resend, keyed) |
| "Internal event" path | `recordAiDeliverySystemEvent()` in `system-events.service.ts` | **No** — hardcoded, never reads provider config, never has a send branch | Fixed placeholder `internal-events@dcaos.local` only | Always `SKIPPED` |

Both pathways write to the same `EmailLog` table (`packages/data/prisma/schema.prisma`), which is why `GET /api/v1/notifications/email-logs` (admin/owner only, tenant-scoped) shows a mix of real-attempt rows and internal-event-only rows. `EmailLog` is **not** the platform audit trail — `AuditLog` is — per `docs/email-notifications-contract.md` EN2 section.

### 1.2 Where each pathway is wired today

| Trigger | Pathway used | Template key | Recipients |
|---|---|---|---|
| Brief status → `SUBMITTED` (`routes/briefs.ts`) | Real (`sendEmailNotification`) | `AI_DELIVERY_BRIEF_REQUEST` | `admin@dca.local` (hardcoded) |
| Client portal deliverable **approved** (`approveClientPortalDeliverable`) | Real (`notifyDcaTeam` → `sendEmailNotification`) | `AI_DELIVERY_APPROVED` | Tenant owner/admin users + `config.replyTo` |
| Client portal deliverable **rejected** (`rejectClientPortalDeliverable`) | Real (`notifyDcaTeam` → `sendEmailNotification`) | `AI_DELIVERY_REVIEW_REQUEST` | Tenant owner/admin users + `config.replyTo` |
| Deliverable sent for client review (`sendAiDeliveryDeliverableForClientReview`) | Real (`notifyClientUsers` → `sendEmailNotification`) | `AI_DELIVERY_REVIEW_REQUEST` | `ClientUserAccess` emails for that client |
| Almost every AI Delivery CRUD lifecycle event (project/brief/content-plan/content-draft/article-image/workflow-run/research/deliverable created, updated, approved, review-requested, archived, etc.) | Internal-only (`recordAiDeliverySystemEvent`) | Mapped generically to one of `AI_DELIVERY_BRIEF_REQUEST` / `AI_DELIVERY_REVIEW_REQUEST` / `AI_DELIVERY_APPROVED` by event-name prefix — **no dedicated template keys per event** | `internal-events@dcaos.local` only (never a real inbox) |

### 1.3 `EmailTemplateKey` enum today (schema-locked)

`CLIENT_INVITE`, `PASSWORD_RESET`, `AI_DELIVERY_BRIEF_REQUEST`, `AI_DELIVERY_REVIEW_REQUEST`, `AI_DELIVERY_APPROVED`, `INVOICE_ISSUED`. There is **no** dedicated template key for "deliverable ready," "image set ready," "monthly report final," or "WordPress draft prepared" — any future wiring of those events would either reuse an existing key loosely or require an approved schema migration to add new enum values (schema changes are out of scope for this docs/audit block per the mega-block gate rules).

---

## 2. Requested event taxonomy — definition + current wiring status

| # | Event (as requested) | Best current code mapping | Wiring status |
|---|---|---|---|
| 1 | **Article ready** | `requestAiDeliveryContentDraftClientReview` → `notifyDcaTeam` | **Wired (real path, disabled-safe)** — admin notification intent on content draft review request (2026-07-09) |
| 2 | **Image set ready** | `markAiDeliveryArticleImageFinalReady` → `notifyDcaTeam` on `AI_DELIVERY_ARTICLE_IMAGE_FINAL_READY` | **Wired (real path, disabled-safe)** — admin notification when image reaches FINAL_READY (2026-07-09) |
| 3 | **Client approved** | `AI_DELIVERY_CONTENT_DRAFT_CLIENT_APPROVED` (internal event) **and** `approveClientPortalDeliverable` → `notifyDcaTeam` | **Wired to the real path.** Tenant owner/admin users and `config.replyTo` are notified with `templateKey: AI_DELIVERY_APPROVED` today. This is the one client-lifecycle event that already reaches real recipients. |
| 4 | **Client rejected** | `AI_DELIVERY_CONTENT_DRAFT_CLIENT_CHANGES_REQUESTED` (internal event) **and** `rejectClientPortalDeliverable` → `notifyDcaTeam` | **Wired to the real path.** Same recipients as #3, `templateKey: AI_DELIVERY_REVIEW_REQUEST`. |
| 5 | **Admin action required** | Brief submitted (real); client rejection (real, includes reason in subject); content draft/plan/brief review requested (real path wired 2026-07-09) | **Mostly wired** — review-requested events now reach `notifyDcaTeam` |
| 6 | **Monthly report final** | `updateAiDeliveryMonthlyReportStatus` when status → `FINAL` | **Wired (real path, disabled-safe)** — admin notification on FINAL transition (2026-07-09) |
| 7 | **WordPress draft prepared** | `prepareAiDeliveryDeliverableWordPressDraft` | **Wired (real path, disabled-safe)** — admin notification after draft prep (2026-07-09) |

**Summary (G83 refresh):** current code has disabled-safe real-path email intent for article/content review requests, image `FINAL_READY`, client deliverable approved/rejected, monthly report `FINAL`, WordPress draft prepared, and several admin-action review requests. Local mode still writes `EmailLog.status=SKIPPED`; no live Resend send has been proven. The remaining launch gap is not "no code path exists"; it is that there is no user-scoped in-system notification model, no live inbox proof, no client email on monthly report `FINAL`, and no notification on image-level client approve/reject rows.

### 2.1 G94-G102 pure mapping inventory

G94-G102 added `packages/shared/src/notification-events.ts` as the schema-safe inventory for notification-worthy events before any DB migration. It includes:

- Canonical `NotificationEventType` values for article ready, image set ready, client approve/reject, image approve/reject, admin action required, monthly report final, WordPress draft prepared, workflow/budget/kill-switch events.
- Pure `mapBusinessEventToNotification()` mapping with required channels.
- `resolveNotificationChannelPolicy()` policy: in-system is always required; email is required for launch-critical events; phone is supplement-only and insufficient for launch; local email remains no-send.
- `APPROVAL_REJECT_NOTIFICATION_MATRIX` for deliverable/image approve/reject behavior.
- `buildNotificationAuditMetadata()` for safe audit metadata, with provider key presence represented as a boolean only.
- `EMAIL_TEMPLATE_INVENTORY` constrained to the current schema enum values. Dedicated keys for ready/final/draft-prepared remain blocked without schema approval.

---

## 3. Disabled-safe local mode (confirmed by code inspection)

### 3.1 Provider resolution (`email.config.ts`)

| `EMAIL_PROVIDER` env value | Resolved provider | Notes |
|---|---|---|
| unset, empty, or any value other than exactly `"resend"` (case-insensitive) | `local` | Fail-safe default — typos or unset env never accidentally select a live provider |
| `"resend"` | `resend` | Only value that can ever reach the live-call branch, and only combined with a present `RESEND_API_KEY` |

`hasResendApiKey` is a **boolean presence check only** (`Boolean(readEnvString("RESEND_API_KEY"))`) — the key value itself is never returned from `getEmailProviderConfig()` or logged anywhere in the audited code path.

G94-G102 also added `getEmailProviderSafetyShape()`, which serializes `sendingEnabled`, `localNoSend`, and `liveProofRequired` without serializing any secret value. A keyed Resend config means "sending branch is configured and live proof is required"; it does **not** mean live proof has been completed.

### 3.2 `sendEmailNotification()` resolved status by config (`email-notifications.service.ts::resolveSendStatus`)

| Config state | Result | Network call made? |
|---|---|---|
| `provider === "local"` (default) | `status: "SKIPPED"`, `errorMessage: "Local email provider selected; no email was sent."` | **No** |
| `provider === "resend"`, no `RESEND_API_KEY` | `status: "FAILED"`, `errorMessage: "Resend provider selected but RESEND_API_KEY is not configured."` | **No** |
| `provider === "resend"`, `RESEND_API_KEY` present | Calls `sendViaResend()` → real `fetch("https://api.resend.com/emails", ...)` | **Yes — the only live-call branch in the entire subsystem** |

### 3.3 `recordAiDeliverySystemEvent()` (`system-events.service.ts`)

Status is a **hardcoded literal `"SKIPPED"`** in the `client.emailLog.create()` call — this function has no conditional branch on provider config at all and can never send, regardless of env. It is correctly self-documenting: `errorMessage: "EN2 internal system event recorded only; no email delivery attempted."`

### 3.4 This subagent's actions against the above

- Did **not** set, unset, or read the value of `RESEND_API_KEY` anywhere.
- Did **not** change `EMAIL_PROVIDER` in any `.env` file.
- Did **not** start the local API server or make any HTTP request (live or local).
- Ran exactly one isolated, no-network, no-DB unit test file (`node --import tsx --test src/config/email.config.test.ts` from `apps/api`) — 4/4 pass. See §5.

### 3.5 Existing disabled-safe smoke (read, not executed, this block)

`npm run smoke:email-outbox:local` (`scripts/smoke-email-outbox-local.mjs`) already proves, end-to-end against a running local API + DB:

- Admin login → `GET /notifications/email-logs` reachable, response contains no secrets (`RESEND_API_KEY`, `re_...`, password/session hashes).
- Outbox status reports `sendingEnabled: false` in default local config.
- Creating an AI Delivery project fixture appends an internal-event `EmailLog` row (`AI_DELIVERY` module, `SKIPPED`, no `providerMessageId`).
- Status filter (`?status=SKIPPED`) returns only `SKIPPED` rows.

This smoke was **not re-run** in this block (would require starting the local API server and database, which is out of scope for a docs/audit-only block per repository service-startup rules — no functional code changed that would require re-proof).

### 3.6 G83 no-send proof checklist

Use this checklist before claiming a notification path is safe in local or staging dry-run mode:

- [ ] `EMAIL_PROVIDER` is unset or resolves to `local`, or the test explicitly asserts `provider === "local"`.
- [ ] Expected `EmailLog` rows have `status: SKIPPED`, `providerMessageId: null`, and no `sentAt`.
- [ ] API responses and serialized test output do not contain `RESEND_API_KEY`, `re_...`, password hashes, session hashes, or raw credentials.
- [ ] The code path under test uses `sendEmailNotification()`, `notifyDcaTeam()`, `notifyClientUsers()`, or `recordAiDeliverySystemEvent()` only; no direct `fetch("https://api.resend.com/emails", ...)` call appears outside `email-notifications.service.ts`.
- [ ] Image-level client approve/reject tests do not claim email proof unless a notification call is added to `approveClientPortalDeliverableImage()` / `rejectClientPortalDeliverableImage()`.
- [ ] Monthly report `FINAL` tests distinguish current admin notification intent from the still-missing client delivery notification.

### 3.7 G99 no-send adapter proof

`apps/api/src/notifications/email-no-send-adapter.ts` defines a local no-send adapter interface for tests and future wiring seams. It returns `SKIPPED`, stores a normalized local attempt, sets `providerMessageId: null`, and never calls `fetch` or Resend.

Focused proof: `apps/api/src/notifications/email-no-send-adapter.test.ts` overrides `globalThis.fetch` with a throwing stub and verifies the adapter does not invoke it.

---

## 4. Live Resend proof plan (planning only — no live call in this document)

**Status:** Planning only, consistent with `PURIVA_LAUNCH_GATE.md` §6 item 5 ("Transactional notification proof — send one bounded test email to an owner-controlled inbox via Resend; low blast radius") and `INTEGRATIONS_TRUTH_MATRIX.md` email row ("Send one bounded test transactional email to an owner-controlled inbox before any client-facing send"). Executing this plan requires a **separate owner-approved block**; this document does not authorize execution.

### 4.1 Pre-conditions (must all be true before scheduling)

- [ ] Owner has explicitly approved a live Resend send block, separate from this planning document
- [ ] A **staging-only** Resend API key is used — never a production key for a first proof
- [ ] Sending domain (`notifications.digitalcubeagency.net`, per `docs/email-notifications-contract.md`) is confirmed verified in the Resend dashboard by the owner before the session
- [ ] Recipient is an **owner-controlled inbox only** — never a real client address, and never a distribution list
- [ ] `EMAIL_FROM_ADDRESS` / `EMAIL_REPLY_TO` env values are confirmed (not guessed) before the session
- [ ] Rollback step agreed: restore `EMAIL_PROVIDER=local` (or unset) immediately after the proof session, and confirm via §3.2 table that the subsystem is back to non-sending before any other work continues

### 4.2 Bounded scope of the live proof session itself

- [ ] Exactly **one** call to `sendEmailNotification()` with `EMAIL_PROVIDER=resend` and the staging key set, targeting the owner-controlled inbox
- [ ] Use an existing template key (e.g. `AI_DELIVERY_APPROVED`) with clearly test-marked subject/body content (e.g. `[DCA-OS-PROOF-DO-NOT-ACT] Test transactional email`) — do not fabricate a real business event
- [ ] Confirm the resulting `EmailLog` row shows `status: SENT` and a real `providerMessageId` (proves the Resend adapter path end-to-end)
- [ ] Confirm the received email in the owner inbox matches the `EmailLog` subject/body exactly
- [ ] Confirm no other recipients were touched — this is not a test of `notifyDcaTeam`/`notifyClientUsers` fan-out, only of the single-call Resend adapter
- [ ] Immediately after: set `EMAIL_PROVIDER` back to `local` (or unset), restart the API, and re-run `npm run smoke:email-outbox:local` to confirm the disabled-safe baseline is restored (`sendingEnabled: false`)

### 4.3 Explicit exclusions from this first live proof

- No fan-out send to real tenant owner/admin/client-user lists (`notifyDcaTeam` / `notifyClientUsers`) — those remain simulated/local until a broader proof is separately approved
- No new event wiring as part of this proof — the proof exercises the existing adapter only, not additional client/admin fan-out
- No production Resend key use
- No bulk or marketing email (out of scope per `docs/email-notifications-contract.md` explicit exclusions)

### 4.4 Evidence template

Save to `$env:TEMP\email-live-resend-proof-<date>.log`:

```
Date:
Owner approval reference:
Resend key scope: staging-only (confirmed, not production)
Sending domain verified in Resend dashboard: yes/no
Recipient (owner-controlled inbox, do not record if it is a real personal address in any committed doc):
EmailLog row id:
EmailLog status: SENT (required) | FAILED (stop and investigate)
providerMessageId present: yes/no
Received email matches EmailLog subject/body: yes/no
EMAIL_PROVIDER restored to local/unset after proof: yes (required)
smoke:email-outbox:local re-run after restore: PASS (required)
Secrets printed or committed during this session: no (required)
```

---

## 5. Tests added / refreshed

`apps/api/src/config/email.config.test.ts` — new, trivial, disabled-safe unit test (`node:test`, no DB, no network, no server start). Verifies:

1. Default provider (no env set) is `"local"` with `hasResendApiKey: false` and the documented default `fromAddress`/`replyTo`.
2. Any unrecognized `EMAIL_PROVIDER` value falls back to `"local"` (fail-safe default, not fail-open).
3. `hasResendApiKey` correctly reports `true` when a key is present, **without** the key value ever appearing in the serialized config object.
4. `EMAIL_PROVIDER=resend` without `RESEND_API_KEY` is reported as configured-but-unkeyed.
5. Missing config serializes as non-sending local mode.
6. A keyed Resend config serializes as `liveProofRequired: true` without exposing the key value.

G94-G102 added:

- `apps/api/src/notifications/notification-events.test.ts` — event taxonomy, event-to-notification mapping, priority/channel policy, approval/reject matrix, audit metadata builder, and template inventory.
- `apps/api/src/notifications/email-no-send-adapter.test.ts` — local no-send adapter result shape and no external `fetch` call.

Run in isolation (from `apps/api`): `node --import tsx --test src/notifications/notification-events.test.ts src/notifications/email-no-send-adapter.test.ts src/config/email.config.test.ts` → 20/20 pass. Picked up automatically by the existing `npm run -w @dca-os-v1/api test:unit` glob (`src/**/*.test.ts`); no script changes were needed.

No new integration test was added under `apps/api/tests/integration/`. Every existing integration test in that folder boots a live app instance and a real Prisma/DB connection (`createApp()` + `createPrismaClient()`); adding one was not necessary to prove disabled-safe behavior for this audit, and starting the API/DB was out of scope for a docs/audit-only block per the repository's local service-startup rules ("do not start API/web unless smoke/browser proof requires it").

---

## 6. Pass criteria (audit closure)

| # | Criterion | Status |
|---|---|---|
| 1 | Both notification pathways (`sendEmailNotification`, `recordAiDeliverySystemEvent`) fully mapped with file/line-level detail | Done (§1) |
| 2 | All six requested events mapped to current code, with wiring status stated explicitly | Done (§2) |
| 3 | Disabled-safe local behavior confirmed by code inspection for every config permutation | Done (§3) |
| 4 | Live Resend proof plan defined with explicit pre-conditions, bounded scope, and exclusions | Done (§4) |
| 5 | Trivial, safe, disabled-safe test added and run in isolation | Done (§5) — 4/4 pass, no network/DB |
| 6 | No live email sent, no secret read/printed/committed | Done — confirmed throughout |
| 7 | G94-G102 no-schema foundation proved with focused unit tests | Done (§5) — 20/20 pass, no network/DB |

---

## 7. Forbidden (this document and any future execution against it)

- Setting `EMAIL_PROVIDER=resend` with a real key without a separate owner-approved block
- Sending to any real client address as a "test"
- Printing or committing `RESEND_API_KEY` (or any other secret) in any log, doc, or commit
- Treating the internal-event path (`recordAiDeliverySystemEvent`) as equivalent to a real notification — it is not a user inbox and can never send
- Claiming monthly report `FINAL` client delivery notification exists — current code only records admin notification intent for the `FINAL` transition
- Claiming image-level client approve/reject sends notifications — current image approval handlers only persist review rows and rejection reason
- Wiring new events into `core.runtime.ts` / `client-publication.runtime.ts` as part of this docs/audit block (those files are outside this block's allowed edit scope)
- Treating G94-G102 pure mapping/policy as persistent in-system notifications — no DB notification model exists yet

---

## 8. Gaps logged for a future scoped block (not implemented here)

| # | Gap | Effort estimate | Notes |
|---|---|---|---|
| 1 | No user-scoped in-system notification model, API, or UI feed | Medium–High | Required before "in-system + email" launch claim; do not treat `EmailLog` as the inbox |
| 2 | Monthly report `FINAL` has admin notification intent but no client email/notification delivery path | Small–Medium | Add client fan-out after product copy/recipient rules are approved; no schema required if reusing an existing template key |
| 3 | Image-level client approve/reject writes review rows only; no admin/client notification intent | Small–Medium | Add no-send admin notification after image approve/reject if product requires operators to react before final deliverable approval |
| 4 | Live Resend adapter proof remains owner-gated and unrun | Low | Execute exactly one owner-inbox proof per §4 in a separate approved block |
| 5 | No dedicated `EmailTemplateKey` values for ready/final/draft-prepared events — all currently borrow one of the six existing generic keys | Requires schema migration | Out of scope without explicit schema-change approval per `AGENTS.md` hard safety boundaries |
| 6 | G94-G102 foundation is not wired to runtime notification persistence | Medium | Requires a separately approved in-system notification DB/API/UI block |

**Recommendation for the next owner-approved block:** implement the persisted in-system notification model/API/UI using the G94-G102 taxonomy, then add monthly report `FINAL` client delivery fan-out. Keep dedicated template keys deferred until a schema gate approves them.

# Email No-Send / Template Hardening Closeout — G505–G516

**Lane:** 4 (Email no-send / template hardening)  
**Date:** 2026-07-10  
**Baseline:** `main` @ `66dcb74`  
**Commit / push / deploy:** none (explicitly not authorized)  
**Live email / Resend / API key / outbound network:** none

---

## Per-task status

| Gate | Title | Status | Evidence |
|------|-------|--------|----------|
| G505 | Email config disabled / missing / live-deferred tests | **DONE** | `email.config.ts` + `email.config.test.ts` — local default, missing key, whitespace key, keyed-but-deferred, authorized shape |
| G506 | Email no-send adapter contract hardening | **DONE** | `email-no-send-adapter.ts` + tests — SKIPPED, no fetch, stable contract, copy lists |
| G507 | Template catalogue completeness | **DONE** | `email-template-catalog.ts` + tests — schema + required typed launch set |
| G508 | Missing template safe behavior | **DONE** | Catalogue resolver + adapter + service skip path — no throw, no provider |
| G509 | Recipient redaction tests | **DONE** | `email-redaction.ts` + adapter integration tests |
| G510 | Template variable redaction tests | **DONE** | `email-redaction.ts` nested/array/secret-leak checks |
| G511 | Launch-critical email matrix | **DONE** | `buildLaunchCriticalEmailMatrix()` + tests |
| G512 | Admin-only email event matrix | **DONE** | `buildAdminOnlyEmailEventMatrix()` + tests |
| G513 | Email proof checklist no-send vs live | **DONE** | `EMAIL_NOTIFICATIONS_PROOF.md` §3.8 |
| G514 | Email docs closeout | **DONE** | Contract + proof + this closeout |
| G515 | Deferred register proposal for live send | **DONE** | Proposal below (docs only; does not edit main-owned deferred register) |
| G516 | Lane validation | **DONE** | Focused unit tests only (no full `validate`) |

---

## Files touched (Lane 4 exclusive)

### Code

- `apps/api/src/config/email.config.ts`
- `apps/api/src/config/email.config.test.ts`
- `apps/api/src/notifications/email-no-send-adapter.ts`
- `apps/api/src/notifications/email-no-send-adapter.test.ts`
- `apps/api/src/notifications/email-template-catalog.ts` *(new)*
- `apps/api/src/notifications/email-template-catalog.test.ts` *(new)*
- `apps/api/src/notifications/email-redaction.ts` *(new)*
- `apps/api/src/notifications/email-redaction.test.ts` *(new)*
- `apps/api/src/services/email-notifications.service.ts` — no-send / template / live-deferred hardening only

### Docs (Lane 4 owned)

- `docs/email-notifications-contract.md`
- `docs/runbooks/EMAIL_NOTIFICATIONS_PROOF.md`
- `docs/runbooks/EMAIL_NO_SEND_G505_G516_CLOSEOUT.md` *(this file)*

### Not edited (ownership / safety)

- `notification-events.ts`, `notification-correlation.ts`, packages/shared notification files (Lane 3)
- Main-owned docs (`STATUS.md`, deferred-scope register, truth matrix, Puriva launch gate)
- `.cursor/settings.json`
- No Prisma / schema / migrations / routes / auth

---

## Behavior summary

1. **Config safety (G505):** `getEmailProviderSafetyShape()` now distinguishes:
   - local / missing → `localNoSend`
   - Resend without key → non-sending
   - Resend + key without `EMAIL_LIVE_SEND_AUTHORIZED=true` → `liveSendDeferred` (still no-send)
   - Resend + key + authorization → `sendingEnabled` shape only (not a live proof)
2. **Service (safe hardening):** `sendEmailNotification` skips on missing template; skips on live-deferred; still fails (no network) when Resend selected without key; live `fetch` only when sending shape is enabled.
3. **No-send adapter (G506):** Uses catalogue + redaction helpers; never calls providers.
4. **Matrices (G511–G512):** Pure read of shared taxonomy for launch-critical and admin-only email event rows.

---

## Focused validation (G516)

PowerShell (from `apps/api`):

```powershell
cd C:\dcaosv1\apps\api
node --import tsx --test src/config/email.config.test.ts src/notifications/email-no-send-adapter.test.ts src/notifications/email-template-catalog.test.ts src/notifications/email-redaction.test.ts
```

**Result:** **34/34 pass** (2026-07-10).

- Full monorepo `validate`: **not run** (per lane instructions).
- Smoke / live Resend: **not run**.
- No API server start; no DB; no outbound network.

---

## G515 — Deferred register proposal (live send)

Propose the following row for main-agent integration into `docs/operator/deferred-scope-register.md` (Lane 4 does **not** edit that file):

| Item | Status | Notes |
|------|--------|-------|
| Live Resend transactional send proof | **DEFERRED** | Requires separate owner-approved block. Preconditions: staging-only `RESEND_API_KEY`, verified sending domain, owner-controlled inbox only, `EMAIL_LIVE_SEND_AUTHORIZED=true` for session only, exactly one `sendEmailNotification` call, then restore local + clear authorization. See `EMAIL_NOTIFICATIONS_PROOF.md` §4 and §3.8 live checklist. |
| Dedicated `EmailTemplateKey` enum values for typed launch templates | **DEFERRED** | Typed catalogue maps onto existing schema keys; dedicated DB keys need schema gate. |
| Fan-out live proof (`notifyDcaTeam` / `notifyClientUsers`) | **DEFERRED** | First live proof is single-call adapter only. |

**Recommendation:** Keep Puriva Launch email row **Not proven / BLOCKED** until the bounded owner-inbox proof completes. Do not treat keyed Resend config alone as launch evidence.

---

## Mistakes / notes

1. Initial service draft briefly treated all `localNoSend` as local-provider SKIPPED, which would have collapsed Resend-without-key `FAILED` into SKIPPED — corrected before validation so unkeyed Resend still returns `FAILED` with no network.
2. `sendingEnabled` semantics tightened vs prior “Resend+key ⇒ enabled” shape: keyed Resend is now deferred until `EMAIL_LIVE_SEND_AUTHORIZED=true`. Outbox status fields expanded accordingly (`localNoSend`, `liveSendDeferred`, `liveProofRequired`).
3. First G510 leak-detector assertion treated the redacted key name `RESEND_API_KEY` as a leak; detector tightened to flag only non-redacted values / `re_…` / `Bearer ` tokens.

---

## Gate recommendation

**GATE: KEEP | agent: yes | budget: medium | mistakes: 2**

1. Branch: `main` (working tree only; no commit)
2. Files: listed above
3. Commits: none
4. Validation: focused unit tests only (see G516)
5. Manual QA: N/A (no browser / no live email)
6. Blockers: live Resend still owner-gated; in-system notification persistence still design-only
7. Polish: optional smoke:email-outbox:local when API+DB available
8. Backend/API/auth/schema/VPS/deploy: schema/auth/VPS/deploy untouched; email service hardened for no-send/defer only

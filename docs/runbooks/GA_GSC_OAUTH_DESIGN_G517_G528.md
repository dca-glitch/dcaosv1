# GA/GSC OAuth Token Storage Design (G517–G528)

> **SUPERSEDED (2026-07-13):** Live GA4/GSC scope is **WITHDRAWN**. Design helpers (`ga-gsc-oauth-token-storage.design.ts`, `ga-gsc.config.ts`) were removed. This document is historical only — do not implement OAuth/token storage from it.

**Status:** Historical design-only — **WITHDRAWN**; no schema, no consent routes, no live Google.
**Lane:** Lane 5 (G517–G528). Written here to avoid conflicting edits to [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) analytics sections owned by parallel work.
**Code contract:** removed (`apps/api/src/core/ga-gsc-oauth-token-storage.design.ts` deleted with withdrawal)
**Related:** [`PHASE_F_BLOCK_61_ENCRYPTED_CREDENTIALS_LOCAL_CHECKLIST.md`](./PHASE_F_BLOCK_61_ENCRYPTED_CREDENTIALS_LOCAL_CHECKLIST.md), [`../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md), [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.1a.

---

## 1. Current ceiling (unchanged)

~~Today’s readiness (`ga-gsc.config.ts`) proves **env presence only**:~~ **Removed with withdrawal.** Historical env keys were:

| Env key | Role |
|---------|------|
| `GA4_GSC_SYNC_ENABLED` | Arms sync flag (`true` / not) — **withdrawn / not required** |
| `GOOGLE_OAUTH_CLIENT_ID` | Presence only — **withdrawn / not required** |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Presence only — never logged — **withdrawn / not required** |

Every shape/readiness/presence result forced `liveOAuthDeferred: true` and `liveSyncDeferred: true`.

`configured_shape_ok` ≠ working OAuth token.

---

## 2. Design record (future — not implemented)

Planned non-secret fields (safe admin/readiness view):

- `tenantId`, `aiDeliveryProjectId`
- `googleAccountSubject` (opaque subject, not email dump in logs)
- `scopes[]`
- `accessTokenExpiresAt`
- `refreshTokenPresent` (boolean)
- `revokedAt`, `lastRefreshAt`
- `lastSyncStatus` ∈ planned readiness states below

Planned secret / ciphertext fields (**never** API-returned or logged):

- `accessTokenCiphertext`, `refreshTokenCiphertext`, `iv`, `authTag`
- ephemeral `authorizationCode` (callback only; never persisted plaintext)

**Encryption plan:** reuse `credential-encryption.service.ts` — AES-256-GCM with tenant-derived key from `CREDENTIAL_ENCRYPTION_MASTER_KEY`. Design flag: `encryptionPlan: "aes-256-gcm-tenant-derived"`.

**Forced design flags:** `schemaImplemented: false`, `liveOAuthDeferred: true`.

---

## 3. Planned readiness states (beyond env shape)

| State | Meaning |
|-------|---------|
| `disabled` | Sync flag off |
| `missing_config` | Client id/secret missing |
| `configured_shape_ok` | Env shape only (today’s ceiling) |
| `needs_oauth` | Shape ok; no consent yet |
| `token_valid` | Encrypted refresh present; access not expired |
| `token_expired` | Access expired; refresh required |
| `token_revoked` | Operator/Google revoke |
| `sync_failed` | Last pull failed closed |

States after `configured_shape_ok` require a **separate owner-approved implementation block** (schema + routes + encryption wiring).

---

## 4. Gaps that still block live OAuth

| Gap | In repo today |
|-----|---------------|
| Consent / callback route | No |
| Prisma token model | No |
| Token refresh / rotation | No |
| Encryption-at-rest wired for GA/GSC tokens | No (WP credentials pattern exists) |
| Documented Google Cloud consent screen + scopes | Out-of-band owner |

Helpers: `getGaGscOauthTokenStorageDesignGaps()` returns all of the above as `false` plus `liveOAuthDeferred: true`.

---

## 5. Property / site mapping (G519–G520)

| Contract | Module | Rule |
|----------|--------|------|
| GA4 property | `ga-gsc-property-mapping.ts` | `ga4PropertyId` must match `properties/{digits}`; tenant/project/domain/timezone required; `liveSyncDeferred: true` |
| GSC site URL | `ga-gsc-site-url-mapping.ts` | `sc-domain:` or `https://` URL-prefix; domain must match `clientDomain`; `liveSyncDeferred: true` |

No secrets in mapping records. Wrong property/site is a proof failure — do not FINAL-promote.

---

## 6. Explicit non-goals (this lane)

- No Prisma migration / schema change
- No OAuth consent or Google API calls
- No token plaintext storage
- No edits to Lane 6 `monthly-report-metrics-*` files
- No claim that live GA/GSC is proven

---

## 7. State / callback / redirect design (WS2 extension)

Design-only helpers in `ga-gsc-oauth-token-storage.design.ts` (flags remain `schemaImplemented: false`, `liveOAuthDeferred: true`):

| Helper | Role |
|--------|------|
| `buildGaGscOauthStateDesign` | Opaque CSRF/state shape (`tenantId`, `aiDeliveryProjectId`, `nonce`, allowlisted `redirectPath`) — never embeds tokens/secrets |
| `getGaGscOauthCallbackDesign` | Planned callback path `/api/v1/integrations/ga-gsc/oauth/callback`; `consentCallbackRouteImplemented: false`; authorization code persistence = `never_plaintext` |
| `resolveGaGscOauthRedirectDesign` | Allowlist-only relative `#/` admin redirects; rejects absolute/external open redirects |

Consent route registration, token exchange, and schema remain owner-gated separate blocks.
# WordPress Credential Policy Decision

**Status:** Encryption foundation merged locally (Architecture Block 4). Encrypted Application Password save on `PublicationTargetCredential` is allowed when `CREDENTIAL_ENCRYPTION_MASTER_KEY` is set. Credential response shapes expose configured/encryption status only. **Live WordPress HTTP calls, connection testing, and publish remain frozen** unless a separately owner-approved proof block explicitly replaces the freeze guard.

**Decision Date:** 2026-06-24 (original STOP) · **Updated:** 2026-07-10 (G78 docs audit + G289–G308 no-live draft lane — credential/error redaction helpers expanded; live API/publish freeze unchanged)

**Scope:** Credential storage policy + live WordPress API/publish freeze gates.

**Related:** [`docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md) · [`docs/runbooks/WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) · [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)

---

## Three WordPress tiers (do not conflate)

| Tier | What it is | Current state | Puriva Launch |
|------|------------|---------------|---------------|
| **1 — Draft preparation** | Local JSON payload via `prepare-wordpress-draft`; no HTTP, no credentials | Local-proven | **In scope** — draft/handoff only |
| **2 — Live draft proof** | Real WordPress HTTP call creating a staging draft post | Plan-only (`WORDPRESS_DRAFT_PROOF.md` §6); not executed | Required before "verified against real site" claims |
| **3 — Publish / production** | `publish-wordpress` with `WORDPRESS_PUBLISH_ENABLED=true` | Disabled-by-default and frozen by service guard; not proven on staging/production | **Out of scope** — auto-publish deferred |

Credential save (encrypted) supports tier 2/3 prep only — it does **not** authorize live calls or publish.

---

## Current Decision

### ✅ Allowed now (local foundation)

- Non-secret WordPress tenant config (`siteUrl`, `siteSlug`, `wordPressComSite`) via `GET/POST /api/v1/tenant/wordpress-config`
- **Encrypted** Application Password save on `PublicationTargetCredential` via Client Hub when `CREDENTIAL_ENCRYPTION_MASTER_KEY` is set — see [`CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md)
- Credential policy shape helpers returning only `{ configured, encryptionAvailable, updatedAt }` plus audit metadata `{ credentialsPresent, siteUrlHost }`
- Credential + error redaction helpers (`wordpress-credentials-redaction.ts`, `wordpress-error-redaction.ts`) that strip Application Passwords, ciphertext, Authorization/Bearer fragments from serializable shapes
- Local draft preparation (`prepare-wordpress-draft`) — no credentials read during prep; payload sanitization strips control chars and never serializes secrets
- Disabled-safe publish endpoint (`provider_disabled` when `WORDPRESS_PUBLISH_ENABLED` unset/false); G300 freeze guard returns before `fetch` even when env + credentials are locally present
- WordPress provider service scaffold (`wordpress.service.ts`)

### ✋ Still frozen (owner-approved block required)

- **No live WordPress REST API calls** for publish, draft proof, or connection testing unless an explicit owner-approved proof block is active on a named target environment
- **No production publish** — `WORDPRESS_PUBLISH_ENABLED=true` requires separate owner approval per [`WORDPRESS_PUBLISH_LOCAL_GATE.md`](../security/WORDPRESS_PUBLISH_LOCAL_GATE.md) Phase D
- **No plaintext credential storage** — never in `TenantSetting`, logs, API responses, or git
- **No raw credential serialization** — response and audit helper shapes must not include plaintext Application Passwords, ciphertext, IVs, auth tags, authorization headers, or full URLs containing secret query strings
- **No "connection verified" claims** without a completed live proof session recorded in evidence
- **No auto-publish** — draft preparation success must never chain into publish

### ✋ Forbidden permanently

- Storing WordPress secrets in plain JSON (`TenantSetting.value` or any unencrypted field)
- Returning Application Password plaintext from any API response
- Logging full credential payloads, ciphertext, or auth headers

---

## Reason live API/publish remain frozen (encryption is no longer the blocker)

Architecture Block 4 closed the original 2026-06-24 STOP rationale (missing encryption). What remains blocked:

1. **Live draft proof not executed** — `WORDPRESS_DRAFT_PROOF.md` §6 is a pre-execution plan only; schema/code gaps (alt/caption/social preview fields, idempotency, approved-image-only filter) must be decided before a staging session
2. **Publish proof not proven** — disabled-safe smokes pass locally; staging/production publish never exercised
3. **Production safety** — irreversible public content if publish enabled prematurely (`INTEGRATIONS_TRUTH_MATRIX.md` WordPress publish row)
4. **Owner approval gates** — live WordPress HTTP, open-gate probe, and production master key each require separate sign-off per `CREDENTIAL_ENCRYPTION_FOUNDATION.md` and `WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`

### Security Policy

Credentials must never be stored without:
1. Encryption layer (AES-256-GCM or envelope encryption)
2. Key management (tenant seed derivation or KMS)
3. Decryption utilities with redaction rules
4. Audit logging that never exposes sensitive material
5. Explicit security review approval

---

## Current Allowed WordPress State

### ✅ What IS Implemented & Supported

1. **Non-Secret Tenant Configuration API**
   - Endpoints: `GET /api/v1/tenant/wordpress-config`, `POST /api/v1/tenant/wordpress-config`
   - Stored fields: `siteUrl`, `siteSlug`, `wordPressComSite` (all non-secret)
   - TenantSetting key: `ai_delivery_wordpress_connection`
   - RBAC: owner/admin only, tenant-scoped
   - Audit: logs `WORDPRESS_CONFIG_UPDATED` with `siteUrlHost` metadata only

2. **Non-Secret Tenant Configuration UI**
   - Location: Company Profile > WordPress Config panel
   - Fields: Site URL input, Site Slug input, WordPress.com checkbox
   - Save button triggers POST /api/v1/tenant/wordpress-config
   - Clear messaging: non-secret config only; publish remains disabled unless explicitly enabled

3. **Encrypted Publication Target Credentials (Block 4)**
   - Endpoints: `GET/POST/DELETE /api/v1/clients/:clientId/publication-targets/:id/credentials`
   - Storage: `PublicationTargetCredential` with AES-256-GCM (`credential-encryption.service.ts`)
   - API returns `configured` boolean only — never plaintext Application Password
   - Helper/unit coverage verifies credential response and audit shapes do not serialize raw credentials or ciphertext
   - Requires `CREDENTIAL_ENCRYPTION_MASTER_KEY` in environment
   - Smoke: `npm.cmd run smoke:credential-encryption:local`
   - **Does not authorize live WordPress calls** — credentials are write-only until a proof block runs

4. **Guarded WordPress Publish Endpoint**
   - Endpoint: `POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/publish-wordpress`
   - Default: returns `provider_disabled` when `WORDPRESS_PUBLISH_ENABLED` unset/false
   - When flag true + credentials configured: still returns `provider_disabled` while the G111 freeze guard is active; live REST calls require a future approved block to replace that guard
   - RBAC: owner/admin only, tenant/project/deliverable scoped
   - UI action: "Test WordPress publish" button on deliverable card

5. **WordPress Provider Service**
   - File: `apps/api/src/services/wordpress.service.ts`
   - Disabled-safe by default; G111 freeze guard returns `provider_disabled` before any live HTTP call even if publish env and credentials are locally present

### Documentation

- `docs/ai-delivery/WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md` — mock/disabled implementation
- Commits: ba89e65, 4be967d, 5abcd71, a6ab51d, 56290cd

---

## Forbidden Until Future Approved Live-Proof Blocks

### ✋ Plaintext Secret Storage (FORBIDDEN)

- Do not store WordPress passwords, tokens, or application passwords in `TenantSetting` or any unencrypted JSON field
- Do not store any credential-like field in plain JSON anywhere in the database
- Use only `PublicationTargetCredential` + `credential-encryption.service.ts` for Application Passwords

### ✋ Secret Exposure (FORBIDDEN)

- Do not return Application Password plaintext from any API response
- Do not echo credentials, ciphertext, or auth headers in logs or error messages
- Do not include credentials in audit metadata beyond `configured: true/false`

### ✋ Live WordPress API Calls (FROZEN — owner block required)

- Do not call WordPress REST API for publish, draft proof, or connection testing unless an explicit owner-approved proof block is active on a named target
- Do not enable `WORDPRESS_PUBLISH_ENABLED=true` on staging or production without owner sign-off
- Do not claim "WordPress verified" or "publish proven" without evidence from an approved proof session

**Why:** Encryption foundation allows safe credential storage; live HTTP and publish proof remain separate owner gates with irreversible public-content risk.

### ✋ Connection Testing (FROZEN — owner block required)

- Do not run "test WordPress connection" against production sites outside an approved proof block
- Do not validate credentials against live instances as part of routine ops until live draft proof plan (`WORDPRESS_DRAFT_PROOF.md` §6) is executed and recorded

### ✋ Audit Logging Violations (FORBIDDEN)

- Do not log full credential payloads
- Do not log passwords, tokens, or API keys
- Do not include credentials in error messages
- Do not expose credentials in response metadata

**Why:** Even audit logs must redact sensitive material.

---

## Encryption Foundation — Status (Block 4 merged)

The prerequisite encryption block described below is **implemented locally**. Remaining open items are owner sign-off and production master key provisioning — not implementation of encrypt/decrypt itself.

See [`CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md) for current API, smoke, and completion checklist.

**Still open before production credentials:**

- [ ] Owner security sign-off (Phase A6)
- [ ] Production `CREDENTIAL_ENCRYPTION_MASTER_KEY` provisioned (Phase D1)
- [ ] Key rotation procedure exercised on target environment

---

## Future WordPress Live-Proof Blocks (after foundation + owner approval)

Only after live draft proof (tier 2) or publish proof (tier 3) blocks are explicitly approved:

### Proposed API

```
POST /api/v1/tenant/wordpress-credentials
{
  "siteUrl": "https://my-site.wordpress.com",
  "siteSlug": "my-site",
  "wordPressComSite": true,
  "applicationPassword": "xxxx-xxxx-xxxx-xxxx"  // encrypted at rest
}

GET /api/v1/tenant/wordpress-credentials
{
  ok: true,
  data: {
    credentials: {
      siteUrl: "https://my-site.wordpress.com",
      siteSlug: "my-site",
      wordPressComSite: true,
      applicationPassword: "***REDACTED***"  // never plaintext
    }
  }
}

POST /api/v1/tenant/wordpress-credentials/test-connection
{
  ok: true,
  data: {
    verified: true,
    message: "WordPress site connection verified."
  }
}

DELETE /api/v1/tenant/wordpress-credentials
{
  ok: true,
  data: { message: "WordPress credentials deleted." }
}
```

### Proposed UI

- Separate admin panel: "WordPress Credentials" (not part of non-secret config)
- Application Password field: masked input, never echoed after save
- "Save Credentials" button: stores encrypted
- "Test Connection" action: separate from save; validates without requiring resave
- Success: "WordPress credentials saved and verified."
- Clear messaging: "Credentials are encrypted. We never store or display plaintext passwords."
- RBAC: owner/admin only

### Audit & Redaction for Credentials Block

- Action: `WORDPRESS_CREDENTIALS_UPDATED`
- Metadata logged: `{ createdAt, credentialsPresent: true, testedAt }` (never password value)
- Never log: full credential value, application password, or plaintext field content
- Error logging: only error category (e.g., "INVALID_CREDENTIALS"), not error details
- Connection test log: only `{ testedAt, verified: true/false }` (not test response body)

### Required Testing for Credentials Block

- Unit tests: encrypt/decrypt cycle for WordPress credential fields
- Unit tests: redaction helper prevents plaintext exposure
- Smoke tests: save credentials without plaintext in logs
- Smoke tests: retrieve credentials with masked application password
- Smoke tests: test connection succeeds with valid credentials
- Smoke tests: test connection fails safely with invalid credentials
- Smoke tests: verify audit log contains no plaintext secrets
- Security test: attempt to read encrypted credential without decryption key → fails

---

## Reference: Current WordPress Implementation Commits

| Phase | Commit | Description |
|---|---|---|
| 1. Provider scaffold | ba89e65 | WordPress service types, validation, mock functions |
| 2. Mock publish endpoint | 4be967d | Disabled/mock publish endpoint with provider_disabled result |
| 3. Publish UI action | 5abcd71 | Admin UI button "Test WordPress publish" on deliverable |
| 4. Docs foundation | 6124220 | WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md |
| 5. Non-secret config API | a6ab51d | GET/POST /api/v1/tenant/wordpress-config |
| 6. Non-secret config UI | 56290cd | Company Profile WordPress Config panel |
| 7. Docs update | 2ae2e1d | Updated WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md |

**Related documentation:**
- `docs/ai-delivery/WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md` — current mock/disabled implementation
- `docs/ai-delivery/WORDPRESS_CREDENTIAL_POLICY_DECISION.md` — this document (credential STOP decision)

---

## Summary

WordPress operates at three distinct tiers — **draft preparation** (local, proven), **live draft proof** (planned, not executed), and **publish** (frozen by default). Non-secret configuration and encrypted Application Password storage (Block 4) are implemented locally; neither authorizes live WordPress HTTP or production publish.

**Live WordPress API calls and publish remain frozen** until separately owner-approved proof blocks run on named target environments. Auto-publish stays out of Puriva Launch v1 scope.

**Path forward:** (1) Resolve or accept `WORDPRESS_DRAFT_PROOF.md` §6 gaps → (2) Owner-approved live draft proof on staging → (3) Owner-approved publish proof (if ever needed) → (4) Production master key + security sign-off before real client credentials.


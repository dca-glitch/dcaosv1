# WordPress Credential Policy Decision

**Status:** STOP — No WordPress credentials may be implemented or stored until approved encryption foundation block is merged.

**Decision Date:** 2026-06-24

**Scope:** All WordPress credential operations deferred to future approved block.

---

## Current Decision

### STOP — No Real WordPress Credentials Yet

- ✋ **Blocking:** No WordPress credentials (passwords, tokens, application passwords, API keys) may be stored in TenantSetting or anywhere else.
- ✋ **Blocking:** No credential reads from TenantSetting are permitted.
- ✋ **Blocking:** No real WordPress API calls may be added.
- ✋ **Blocking:** No live WordPress connection verification may be implemented.
- ✋ **Blocking:** No credential fields may be added to any API contract.
- ✅ **Allowed:** Non-secret WordPress tenant config (site URL, site slug, WordPress.com indicator) remains fully supported.
- ✅ **Allowed:** Mock/disabled publish endpoint remains fully supported.
- ✅ **Allowed:** Provider service scaffold remains fully supported.

---

## Reason for STOP Decision

### Missing Encryption Foundation

1. **No encryption library in dependencies**
   - Zero crypto-encryption packages installed (no bcryptjs, tweetnacl, libsodium, etc.)
   - Only built-in Node.js `crypto` module available (password hashing only)

2. **No credential storage pattern**
   - TenantSetting stores plain JSON: `value: Json` (no encrypted field type)
   - No encryption/decryption utility functions exist
   - No vault or KMS integration

3. **Plaintext storage risk**
   - Implementing credentials now would mean storing plaintext passwords in PostgreSQL
   - Violates security best practices
   - Would require future migration/remediation (expensive)

4. **Existing secret pattern inadequate**
   - OpenRouter API key: stored in env only, not per-tenant
   - Not suitable as model for tenant-scoped credentials
   - OpenRouter uses global single-key pattern; WordPress requires per-tenant credentials

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
   - Clear messaging: "non-secret config only", "no credentials stored", "publish remains disabled/mock"

3. **Mock WordPress Publish Endpoint**
   - Endpoint: `POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/publish-wordpress`
   - Result: Always returns `ok: false, status: "provider_disabled"`
   - No external WordPress API call
   - RBAC: owner/admin only, tenant/project/deliverable scoped
   - UI action: "Test WordPress publish" button on deliverable card

4. **WordPress Provider Service Scaffold**
   - File: `apps/api/src/services/wordpress.service.ts`
   - Mock functions return `provider_disabled` result
   - No credential reads or env var reads
   - Ready for real implementation after credential block approved

### Documentation

- `docs/ai-delivery/WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md` — mock/disabled implementation
- Commits: ba89e65, 4be967d, 5abcd71, a6ab51d, 56290cd

---

## Forbidden Until Future Approved Encryption Block

### ✋ Secret Storage (FORBIDDEN)

- Do not store WordPress passwords in TenantSetting
- Do not store WordPress tokens in TenantSetting
- Do not store WordPress application passwords in TenantSetting
- Do not store WordPress API keys in TenantSetting
- Do not store any credential-like field in plain JSON

**Why:** No encryption layer exists to make plaintext storage safe.

### ✋ Secret Reads (FORBIDDEN)

- Do not read WordPress credentials from TenantSetting
- Do not decrypt credentials from TenantSetting (no decryption utility exists)
- Do not return credentials to API response
- Do not echo credentials in logs

**Why:** No decryption pattern established; no redaction utilities built.

### ✋ WordPress API Calls (FORBIDDEN)

- Do not call WordPress REST API (`/wp-json/wp/v2/posts`)
- Do not make HTTP requests to WordPress endpoints
- Do not implement real publish functionality
- Do not add credential validation/testing

**Why:** No real credential source exists yet; only mock endpoint allowed.

### ✋ Connection Testing (FORBIDDEN)

- Do not implement "test WordPress connection" action
- Do not verify WordPress API accessibility
- Do not validate WordPress credentials against live instance
- Do not call WordPress site endpoint

**Why:** Requires real credentials, which are not allowed yet.

### ✋ Audit Logging Violations (FORBIDDEN)

- Do not log full credential payloads
- Do not log passwords, tokens, or API keys
- Do not include credentials in error messages
- Do not expose credentials in response metadata

**Why:** Even audit logs must redact sensitive material.

---

## Future Prerequisite: Credential Encryption & Redaction Foundation

Before any WordPress credential block may be implemented, a separate approved foundation block must:

1. **Encryption Utility Layer**
   - Choose encryption algorithm (AES-256-GCM recommended)
   - Implement encrypt/decrypt functions in `apps/api/src/security/encryption.service.ts`
   - Design key source (tenant seed derivation, KMS, or key rotation service)
   - Document backup/recovery strategy

2. **TenantSetting Schema Extension**
   - Prisma migration: add optional `encrypted: boolean` field to TenantSetting
   - OR define new EncryptedSetting model with automatic encryption
   - Rationale: distinguish non-secret from encrypted fields

3. **Credential Policy Document**
   - Define which fields require encryption (all credential-like fields)
   - Define redaction rules (never log full value, only field name + timestamp)
   - Define audit metadata rules (what is safe to log)
   - Define key rotation strategy (rekey, rekeying schedule, rollback plan)
   - Define backup/recovery implications

4. **Redaction Utilities**
   - Helper function: redactCredential(value: string): string → "***REDACTED***"
   - Helper function: sanitizeCredentialMetadata(metadata: object): object → filters out secret fields
   - Pattern consistent with WordPress config metadata redaction (siteUrlHost only)

5. **Smoke Tests for Encryption Block**
   - Encrypt credential field without error
   - Decrypt credential field and verify value matches
   - Attempt decrypt with wrong tenant ID → fails safely
   - Verify plaintext never appears in logs
   - Verify audit log redacts field values
   - Exit code 0 on all encryption tests

6. **Security Review**
   - Credential policy reviewed by security/compliance team
   - Encryption algorithm approved for production use
   - Key management strategy documented and approved
   - Risk assessment: data breach scenario and mitigation steps

**Deliverables:**
- `docs/ai-delivery/CREDENTIAL_ENCRYPTION_FOUNDATION.md` (policy document)
- `apps/api/src/security/encryption.service.ts` (utilities)
- Prisma migration + schema update
- `scripts/smoke-credential-encryption.mjs` (smoke tests)
- Security review approval + sign-off

---

## Future WordPress Credentials Block (After Foundation Approved)

Only after the credential encryption foundation block is merged and approved may a WordPress credentials block be implemented:

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

WordPress non-secret configuration (site URL, site slug, WordPress.com indicator) is fully implemented and approved for production use. Mock/disabled publish endpoint is fully implemented and approved for testing.

**Real WordPress credentials remain blocked** until a separate credential encryption/redaction foundation block is approved and merged. This prevents plaintext storage of secrets and ensures proper key management, redaction, audit logging, and security review.

**No commits performed. No credentials touched. No encryption implemented. No real WordPress calls added.**

The path forward: (1) Approve credential encryption foundation block → (2) Implement and merge foundation → (3) Implement WordPress credentials block → (4) Implement real WordPress publish.


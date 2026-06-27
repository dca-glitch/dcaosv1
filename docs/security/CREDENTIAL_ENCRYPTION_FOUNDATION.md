# Credential Encryption Foundation

**Status:** Implemented locally (Architecture Block 4). Production master key and owner sign-off remain separate gates.

**Scope:** Encrypted storage for WordPress Application Passwords on `PublicationTargetCredential` records. Plaintext credentials are never returned by the API after save.

---

## What is encrypted

| Field | Storage | API exposure |
|-------|---------|--------------|
| WordPress Application Password | `PublicationTargetCredential.ciphertext` + `iv` + `authTag` | Write-only; status endpoint returns `configured` boolean only |

Algorithm: **AES-256-GCM** with a per-tenant derived key from the platform master key.

Implementation: `apps/api/src/services/credential-encryption.service.ts`

---

## Environment variable

```env
# 32-byte key, base64-encoded (44 characters typical)
CREDENTIAL_ENCRYPTION_MASTER_KEY=
```

### Generate a local dev key (PowerShell)

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Add the output to your local `.env` (never commit `.env`).

**Restart the API** after changing this variable. The running Node process reads env at startup only.

Related publish gate (separate):

```env
WORDPRESS_PUBLISH_ENABLED=false
```

---

## Local verification

1. Set `CREDENTIAL_ENCRYPTION_MASTER_KEY` in `.env`.
2. Restart API: `npm.cmd run dev:api`
3. Run smoke:

```powershell
cd C:\dcaosv1
npm.cmd run smoke:credential-encryption:local
```

4. In Client Hub → **WordPress credentials**, save an Application Password for a publication target. The UI confirms save; the password field clears and cannot be read back.

When the master key is **missing**, Client Hub shows an encryption-not-ready notice and credential save returns `400 PUBLICATION_CREDENTIALS_INVALID`.

---

## Production / staging rules

| Rule | Requirement |
|------|-------------|
| Separate keys | Use a **different** `CREDENTIAL_ENCRYPTION_MASTER_KEY` per environment (dev ≠ staging ≠ production). |
| Secret storage | Store the key in the host secret manager or deployment env — not in git, chat, or Notion. |
| Key loss | Losing the master key makes existing ciphertext unrecoverable. Operators must re-enter Application Passwords in Client Hub. |
| Rotation | Generate a new key, redeploy, re-save all publication target credentials. Old ciphertext cannot be decrypted with the new key. |
| Deploy gate | Live WordPress publish (`WORDPRESS_PUBLISH_ENABLED=true`) requires owner approval per `docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md` Phase D. |

---

## API endpoints (admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/clients/:clientId/publication-targets/:id/credentials` | Status: `configured`, `encryptionAvailable`, `updatedAt` |
| POST | same | Save Application Password (encrypted) |
| DELETE | same | Remove stored credentials |

Audit events: `WORDPRESS_CREDENTIALS_UPDATED`, `WORDPRESS_CREDENTIALS_DELETED` — metadata never includes plaintext passwords.

---

## Related documents

- `docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md` — full security phases A–D
- `docs/ai-delivery/WORDPRESS_CREDENTIAL_POLICY_DECISION.md` — policy stop/go gates
- `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md` — Architecture Block 4 definition

---

## Block 4 completion checklist (local)

- [x] Schema: `PublicationTargetCredential`
- [x] AES-256-GCM encrypt/decrypt service
- [x] Client Hub credential save UI (write-only)
- [x] AI Delivery deliverables: credential status in website publishing workflow
- [x] This foundation doc
- [x] `npm run smoke:credential-encryption:local`
- [ ] Owner security sign-off (Phase A6)
- [ ] Production master key provisioned (Phase D1)

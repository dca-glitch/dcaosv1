# Post-MVP Block 44 — Credential Master Key Local Probe

**Status:** Focused local probe for Architecture Block 4 credential encryption master key readiness.

**Scope:** Narrow smoke on publication-target credential encryption availability and guarded save path. Complements full `smoke:credential-encryption:local` matrix without replacing it. No schema, auth, or middleware logic changes.

Related:

- `docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`
- `apps/api/src/services/credential-encryption.service.ts`
- `scripts/smoke-credential-master-key-probe-local.mjs`
- `scripts/smoke-credential-encryption-local.mjs` (full Block 4 matrix)

---

## Run (baseline — master key absent or present)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:credential-master-key-probe:local
```

Included in `npm run smoke:pre-staging:local`.

Baseline passes when encryption is off **or** when API reports `encryptionAvailable=true` from credential status endpoints.

---

## Run (strict master key roundtrip — owner/manual)

1. Stop local API.
2. Generate and set in `.env` (never commit):

```env
CREDENTIAL_ENCRYPTION_MASTER_KEY=<32-byte-base64-key>
```

3. Restart API: `npm.cmd run dev:api`
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_CREDENTIAL_MASTER_KEY = "true"
npm.cmd run smoke:credential-master-key-probe:local
Remove-Item Env:SMOKE_EXPECT_CREDENTIAL_MASTER_KEY -ErrorAction SilentlyContinue
```

Expect probe PASS with `encryptionAvailable=true` and successful encrypt roundtrip on a smoke-owned publication target.

5. Restore or keep key per local dev policy before other smokes.

---

## Pass criteria

- Admin login succeeds
- Credential status endpoint returns no plaintext passwords, ciphertext, IV, or auth tag
- Baseline: probe documents encryption-off or encryption-ready state without failing pre-staging
- Strict mode: `encryptionAvailable=true` and save roundtrip succeeds; responses never leak secrets
- Probe fails fast if strict flag is set but master key is missing on running API

---

## Notes

- Production master key provisioned per environment remains a separate owner gate (Phase D1 in credential security design).
- Client Hub credential save UI stays write-only; this probe validates backend readiness only.
- See Block 45 for WordPress publish open gate (depends on Block 4 when saving credentials).

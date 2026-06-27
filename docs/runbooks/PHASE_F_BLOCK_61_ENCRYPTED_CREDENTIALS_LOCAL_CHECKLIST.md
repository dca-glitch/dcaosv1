# Phase F Block 61 — Encrypted Credentials Local Checklist

**Status:** Operator checklist for Architecture Block 4 master key readiness (88% local scope).

**Scope:** Documentation + focused probe smoke. No schema, auth, or encryption service logic changes.

Related:

- [`docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md)
- [`POST_MVP_BLOCK_44_CREDENTIAL_MASTER_KEY_LOCAL_PROBE.md`](./POST_MVP_BLOCK_44_CREDENTIAL_MASTER_KEY_LOCAL_PROBE.md)
- `scripts/smoke-credential-master-key-probe-local.mjs`
- `apps/api/src/services/credential-encryption.service.ts`

---

## Operator checklist (local)

1. Confirm local API on port **4000**: `npm.cmd run dev:api`
2. Confirm `AUTH_SEED_TEST_PASSWORD` is set (never print its value).
3. **Baseline (encryption off or on):** run probe below — must PASS for pre-staging.
4. **Optional strict roundtrip:** set `CREDENTIAL_ENCRYPTION_MASTER_KEY` in `.env` (32-byte base64, never commit), restart API, run strict probe.
5. **Rotate procedure (document only locally):** generate new key → re-encrypt credentials script (deferred to owner gate) → verify probe → retire old key from env.
6. Confirm Client Hub credential UI remains write-only; probe validates backend status only.

---

## Run (baseline probe)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:credential-master-key-probe:local
```

Included in `npm run smoke:pre-staging:local`.

Baseline passes when encryption is off **or** when API reports `encryptionAvailable=true`.

---

## Run (strict master key roundtrip — owner/manual)

1. Stop local API.
2. Set in `.env` (never commit):

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

5. Restore env per local dev policy before other smokes.

---

## Pass criteria

- Admin login succeeds; API health `database.status=ready`
- Credential status endpoint returns no plaintext passwords, ciphertext, IV, or auth tag
- Baseline probe documents encryption-off or encryption-ready state
- Strict mode (when used): `encryptionAvailable=true` and save/delete roundtrip succeeds
- No secrets printed in smoke output

---

## Deferred (owner gates)

- Production master key provision per environment
- Automated re-encrypt script for master key rotation on staging/prod

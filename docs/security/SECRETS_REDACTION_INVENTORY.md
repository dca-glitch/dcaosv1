# Secrets Redaction Inventory (G410)

**Status:** Read-only inventory for G409–G428. Names only — never print, commit, or infer secret values. No live calls.

**Honesty rule:** Listing a helper here means local code/docs practice exists. It does **not** mean staging/production secret handling is proven.

---

## 1. Operator conventions

| Practice | Where | Status |
|---|---|---|
| Env **names** only in docs | `ENV_READINESS_INVENTORY.md`, runbooks | Present |
| Local admin password from shell only | `$env:AUTH_SEED_TEST_PASSWORD` | Present |
| Never `git add` `.cursor/settings.json` | Operator guards | Present (observed `??`) |
| Proof logs scrubbed before share | Validation guards / runbook | Process only — not automated |

---

## 2. Code helpers (local)

| Helper | Path | What it redacts | Live? |
|---|---|---|---|
| WordPress credential shape | `apps/api/src/services/wordpress-credentials-redaction.ts` | Drops password/token/ciphertext keys; presence flags only | No live |
| WordPress credential metadata | same | Host-only site identity + `credentialsPresent` | No live |
| WordPress serializable deep redact | same | Credential-like keys + secret-looking strings → `[REDACTED]` | No live |
| Storage error redaction | `apps/api/src/storage/storage-error-redaction.ts` | `storageKey` paths, R2 access/secret key fragments, stacks | No live |
| Forbidden secret keywords (request body) | `apps/api/src/core/core.runtime.ts` (`FORBIDDEN_SECRET_KEYWORDS`) | Rejects secret-like request keys on selected paths | No live |
| Client publication credential keys | `apps/api/src/core/client-publication.runtime.ts` | Forbidden credential key list | No live |
| Prompt injection sanitize | `apps/api/src/core/ai-prompt-injection-sanitize.ts` | Untrusted instruction patterns → `[REDACTED-UNTRUSTED]` | No live |

---

## 3. Gaps (honest)

| Gap | Notes |
|---|---|
| No centralized logger `redactSecret()` | Operators must scrub `$env:TEMP` logs manually |
| Full `DATABASE_URL` may appear in misconfigured logs | Never paste validate/smoke logs without review |
| OAuth client secrets / Resend / OpenRouter keys | Env presence only in readiness; values never documented |
| Credential encryption master key | Probe smokes check configured/not; never print key |

---

## 4. Related tests

| Test | Path | Status |
|---|---|---|
| WordPress credentials redaction | `wordpress-credentials-redaction.test.ts` | Present |
| Storage error redaction | `storage-error-redaction.test.ts` | Present (G409 lane) |
| Notification event metadata exclusions | `notification-events.test.ts` | Present |
| Client portal error safety | `client-portal-error-safety.test.ts` | Present |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

No secrets printed. Production freeze unchanged. Puriva Launch remains **BLOCKED**.

# Secrets Redaction Inventory (G638)

**Status:** Read-only inventory refresh for G637–G648 (Security / redaction / boundary). Names only — never print, commit, or infer secret values. No live calls.

**Context (G469–G708):** Local/no-IO foundations continue to expand across concurrent lanes. This inventory indexes **local code/docs practice** only. Staging/production secret handling and live proof remain **deferred**. Production remains frozen. Puriva Launch remains **BLOCKED**.

**Honesty rule:** Listing a helper here means local code/docs practice exists (or is observed on disk from another lane). It does **not** mean staging/production secret handling is proven.

**Supersedes for operator use:** Prefer this document over the G410-era wording for post-G468 alignment. Historical G410 content is absorbed here.

---

## 1. Operator conventions

| Practice | Where | Status |
|---|---|---|
| Env **names** only in docs | `ENV_READINESS_INVENTORY.md`, runbooks | Present |
| Local admin password from shell only | `$env:AUTH_SEED_TEST_PASSWORD` | Present |
| Never `git add` `.cursor/settings.json` | Operator guards | Present (observed `??`) |
| Proof logs scrubbed before share | Validation guards / runbook | Process only — not automated |
| No secret values in STATUS / deferred / matrix patches | Main-owned docs (propose only) | Process |

---

## 2. Code helpers (local) — HEAD baseline `66dcb74`

| Helper | Path | What it redacts | Live? |
|---|---|---|---|
| WordPress credential shape | `apps/api/src/services/wordpress-credentials-redaction.ts` | Drops password/token/ciphertext keys; presence flags only | No live |
| WordPress credential metadata | same | Host-only site identity + `credentialsPresent` | No live |
| WordPress serializable deep redact | same | Credential-like keys + secret-looking strings → `[REDACTED]` | No live |
| WordPress error redaction | `apps/api/src/services/wordpress-error-redaction.ts` | Application password / Authorization / token / ciphertext fragments in error text | No live |
| Storage error redaction | `apps/api/src/storage/storage-error-redaction.ts` | `storageKey` paths, R2 access/secret key fragments, stacks | No live |
| Forbidden secret keywords (request body) | `apps/api/src/core/core.runtime.ts` (`FORBIDDEN_SECRET_KEYWORDS`) | Rejects secret-like request keys on selected paths | No live |
| Client publication credential keys | `apps/api/src/core/client-publication.runtime.ts` | Forbidden credential key list | No live |
| Prompt injection sanitize | `apps/api/src/core/ai-prompt-injection-sanitize.ts` | Untrusted instruction patterns → `[REDACTED-UNTRUSTED]` | No live |

### 2.1 Observed on disk / other-lane (not claimed as this lane’s deliverable)

| Helper | Path | Note |
|---|---|---|
| Email recipient / template-variable redaction | `apps/api/src/notifications/email-redaction.ts` | Present on working tree; **not in HEAD `66dcb74`** — owned by notifications lane; do not edit here |
| Private delivery download boundary | `apps/api/src/storage/private-delivery-download-boundary.ts` | Working-tree / storage lane; not claimed as secrets-lane proof |

---

## 3. Gaps (honest)

| Gap | Notes |
|---|---|
| No centralized logger `redactSecret()` | Operators must scrub `$env:TEMP` logs manually |
| Full `DATABASE_URL` may appear in misconfigured logs | Never paste validate/smoke logs without review |
| OAuth client secrets / Resend / OpenRouter keys | Env presence only in readiness; values never documented |
| Credential encryption master key | Probe smokes check configured/not; never print key |
| Target-env proof-log scrub automation | Deferred — process only until owner-approved live sessions |

---

## 4. Related tests

| Test | Path | Status |
|---|---|---|
| WordPress credentials redaction | `wordpress-credentials-redaction.test.ts` | Present (HEAD) |
| WordPress error redaction | `wordpress-error-redaction.test.ts` | Present (HEAD) |
| Storage error redaction | `storage-error-redaction.test.ts` | Present (Lane 1 owns — do not edit) |
| Notification event metadata exclusions | `notification-events.test.ts` | Present |
| Client portal error safety | `client-portal-error-safety.test.ts` | Present (Lane 9 owns — do not edit) |
| Email redaction unit tests | `email-redaction.test.ts` | Observed on disk / other lane — not in HEAD |

---

## 5. Truth labels

| Claim | Label |
|---|---|
| Helpers + unit tests exist locally | **Local unit / integration** |
| Staging/prod secret non-exposure | **Not proven** (deferred) |
| Puriva Launch | **BLOCKED** |
| Production readiness | **NO** |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

No secrets printed. Production freeze unchanged. Puriva Launch remains **BLOCKED**.

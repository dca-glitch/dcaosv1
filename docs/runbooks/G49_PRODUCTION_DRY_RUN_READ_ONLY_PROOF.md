# G49 Production Dry-Run / Read-Only Proof

**Status (active):** **G49 formal dry-run PASS** on 2026-07-14 â€” classification `CONDITIONAL_GO`. Owner approval received for this read-only GO/NO-GO review. SSH discovery + public probes + candidate identity completed. Does **not** authorize G50, production mutation, or deploy. See [`../audits/PRODUCTION_DEPLOY_GO_NO_GO_REVIEW_2026-07-14.md`](../audits/PRODUCTION_DEPLOY_GO_NO_GO_REVIEW_2026-07-14.md).

**Historical note:** Public Â§6.2 probes were first collected 2026-07-09 without full formal closure; that record remains below and is not rewritten.

**Gate:** G49 â€” Production dry-run / read-only proof
**Date prepared:** 2026-07-09
**Date formal execution:** 2026-07-14
**Branch baseline (formal):** `main` at `01b7e04` Â· candidate runtime `c5e03eb` Â· production runtime `57f9c52`
**Source of truth:** [`docs/STATUS.md`](../STATUS.md)

Related:

- [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md) â€” production safety blockers and gate sequence
- [`STAGING_READINESS.md`](./STAGING_READINESS.md) â€” staging proven; does not authorize production
- [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](./G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) â€” environment proof approval pattern
- `../operator/deferred-scope-register.md` (archived reference; see Git history) â€” Puriva Launch blockers (separate gate)
- [`../operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md) â€” operator entry point

---

## 1. Status

| Item | State |
|------|--------|
| G49 public read-only probes (Â§6.2) executed | **YES** â€” 2026-07-09 (historical) + **reconfirmed 2026-07-14** |
| G49 SSH read-only discovery (Â§6.3) | **YES** â€” 2026-07-14 formal gate |
| G49 full gate PASS (incl. owner approval for this block) | **YES** â€” 2026-07-14 Â· result `CONDITIONAL_GO` |
| Authorizes G50 production deploy | **NO** â€” separate owner sentence naming `c5e03eb` required |
| Authorizes production mutation | **NO** |
| Production readiness | **CONDITIONAL** â€” G50 may be requested; deploy still frozen until G50 approval + preconditions |
| G54 HSTS/proxy baseline | **PASS** |
| G50 production deploy | **Not executed** |
| Puriva Launch | **Blocked** â€” separate live proof gates |
| Production candidate | **`c5e03eb`** (exact staging-proven runtime; not `01b7e04`) |

### 1.1 Public probe evidence (2026-07-09)

Collected via `Invoke-WebRequest` from local PowerShell, read-only, no mutation:

| Target | HTTP | HSTS | DB |
|--------|------|------|----|
| `https://staging.digitalcubeagency.net` | 200 | `max-age=31536000; includeSubDomains` | n/a (root) |
| `https://staging.digitalcubeagency.net/api/v1/health` | 200 | present | `ready` |
| `https://system.digitalcubeagency.net` | 200 | `max-age=31536000; includeSubDomains` | n/a (root) |
| `https://system.digitalcubeagency.net/api/v1/health` | 200 | present | `ready` |

All four Â§6.2 probes PASS. Â§6.3 SSH read-only discovery was **not** performed (requires separate explicit SSH read-only approval). No production or staging mutation occurred while collecting this evidence.

### 1.2 Public probe evidence re-run (2026-07-09, Subagent B â€” G49 formal closure documentation task)

Collected via `Invoke-WebRequest` from local Windows PowerShell, read-only, no mutation. Log: `$env:TEMP\dca-subagent-b-g49.log`.

| Target | HTTP | HSTS | DB |
|--------|------|------|----|
| `https://staging.digitalcubeagency.net` | 200 | `max-age=31536000; includeSubDomains` | n/a (root) |
| `https://staging.digitalcubeagency.net/api/v1/health` | 200 | present | `ready` |
| `https://system.digitalcubeagency.net` | 200 | `max-age=31536000; includeSubDomains` | n/a (root) |
| `https://system.digitalcubeagency.net/api/v1/health` | 200 | present | `ready` |

All four Â§6.2 probes PASS again. This confirms Â§1.1 evidence remains current as of 2026-07-09. **This re-run does not, by itself, satisfy Â§10 item 1** (owner-approval sentence for a specific G49 execution block) â€” that sentence still has not been separately recorded. Formal G49 gate closure therefore remains **NOT complete**. G50 remains **NOT executed / NOT authorized**. Production readiness remains **NO**. No SSH was used. No production or staging mutation occurred.

---

## 2. Purpose

G49 is a **read-only production dry-run / proof gate**. It collects evidence that production and staging remain healthy, separated, and unchanged **without** deploying code, mutating containers, reloading Caddy, running migrations, or changing env/secrets.

G49 answers: *â€œIs it safe to **consider** a future G50 production deploy decision?â€* â€” not *â€œDeploy now.â€*

G49 does **not** clear all G53 production blockers. It proves runtime health and documents the pre-deploy baseline. Remaining blockers (rollback evidence, env separation proof, integration truth, tenant boundary re-verification, etc.) must still be resolved or owner-accepted before G50.

---

## 3. Preconditions

All must be true before G49 execution is requested:

| # | Precondition |
|---|--------------|
| 1 | G54 HSTS/proxy: **PASS** (Caddy HSTS on staging and production) |
| 2 | G53 production safety plan: **approved** (planning only) |
| 3 | Staging deploy/smoke: **G46d/G47 PASS** |
| 4 | Production deploy: **not executed**; production readiness **NO** |
| 5 | Working tree clean on `main` (or pinned feature branch with owner approval) |
| 6 | **Explicit owner approval** for G49 execution block |
| 7 | No concurrent staging refresh, VPS mutation, or deploy block in progress |

---

## 4. Allowed scope

G49 may perform **read-only** actions only:

- Local repo inspection: `git status`, `git log`, doc baseline reads
- Public HTTPS probes (no auth required): root + `/api/v1/health` on staging and production
- Header inspection: HTTP status, `Strict-Transport-Security`, `Server`, health JSON body
- Log capture to `$env:TEMP` and review in Notepad
- Docs-only closeout **after** G49 PASS and owner approval (separate commit block)
- Optional SSH **read-only discovery** â€” only in a later owner-approved G49 execution block (see Â§9)

---

## 5. Forbidden scope

G49 must **not**:

- Deploy application code or promote artifacts to production
- Run `docker compose up/down/recreate`, container restart, or image rebuild
- Reload or change Caddy / proxy / DNS
- Run migrations or touch production/staging databases
- Read, print, or change `.env` / secrets
- Enable live integrations (AI provider, R2, GA/GSC, WordPress publish, email sending)
- SSH writes, file edits, service restarts, or backup creation on VPS
- Commit or push unless docs-only closeout and owner explicitly approves after review
- Claim production readiness **YES** or authorize G50

---

## 6. Evidence to collect

### 6.1 Local repo (read-only)

- Branch and sync state (`git status --short --branch`)
- Latest commit SHA and message (`git log -5 --oneline`)
- Docs baseline confirms: production readiness **NO**; G54 **PASS**; G49/G50 **not executed**
- No uncommitted runtime changes unless owner approved planning block

### 6.2 Public internet probes (required)

| Target | URL | Capture |
|--------|-----|---------|
| Staging root | `https://staging.digitalcubeagency.net` | HTTP status, HSTS, Server |
| Staging health | `https://staging.digitalcubeagency.net/api/v1/health` | HTTP status, body, DB ready |
| Production root | `https://system.digitalcubeagency.net` | HTTP status, HSTS, Server |
| Production health | `https://system.digitalcubeagency.net/api/v1/health` | HTTP status, body, DB ready |

### 6.3 Optional SSH read-only discovery (owner approval required)

Only in a separate G49 execution block with explicit SSH read-only approval:

- Host identity (`hostname`, `uname -a` read-only)
- Container list (`docker ps` â€” no recreate)
- Compose file paths (existence only)
- Active Caddyfile path (`/opt/dca/caddy/Caddyfile`)
- G54 backup existence (`/opt/dca/backups/Caddyfile.G54-HSTS.*.bak`)
- Production/staging port bindings (read-only `docker port` / inspect)
- **No writes, no restarts, no reloads**

### 6.4 G53 blocker checklist (document status â€” not all cleared by G49)

Record pass/fail/unknown for each Â§4.1 blocker in [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md):

1. HSTS/proxy â€” **PASS** (G54)
2. Rollback/restore evidence â€” not proven
3. Env/secrets separation â€” not production-proven
4. Credential storage â€” not production-proven
5. Tenant/client boundary â€” local/staging proven; re-verify on target
6. Integration truth matrix â€” config-shape only locally
7. Controlled dry-run â€” **this gate (G49)**
8. Gate sequence â€” G49 before G50

---

## 7. Local read-only proof commands

Run from `C:\dcaosv1` in external Windows PowerShell. Log to `$env:TEMP`. Stop on failure.

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-g49-local-proof-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
"=== G49 Local Read-Only Proof ===" | Out-File $log
"Timestamp: $(Get-Date -Format o)" | Add-Content $log
"" | Add-Content $log
"--- git status --short --branch ---" | Add-Content $log
git status --short --branch 2>&1 | Add-Content $log
"" | Add-Content $log
"--- git log -5 --oneline ---" | Add-Content $log
git log -5 --oneline 2>&1 | Add-Content $log
"" | Add-Content $log
"--- docs baseline scan ---" | Add-Content $log
Select-String -Path docs\STATUS.md -Pattern 'Production readiness','G54 HSTS','G49','G50' -SimpleMatch 2>&1 | ForEach-Object { $_.Line.Trim() } | Add-Content $log
notepad $log
```

---

## 8. Public probe commands

```powershell
$log = Join-Path $env:TEMP "dca-g49-public-proof-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
"=== G49 Public Read-Only Proof ===" | Out-File $log
"Timestamp: $(Get-Date -Format o)" | Add-Content $log
$urls = @(
  'https://staging.digitalcubeagency.net',
  'https://staging.digitalcubeagency.net/api/v1/health',
  'https://system.digitalcubeagency.net',
  'https://system.digitalcubeagency.net/api/v1/health'
)
foreach ($url in $urls) {
  "" | Add-Content $log
  "--- $url ---" | Add-Content $log
  try {
    $resp = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30
    "HTTP_STATUS=$($resp.StatusCode)" | Add-Content $log
    $hsts = $resp.Headers['Strict-Transport-Security']
    if ($hsts) { "HSTS=$hsts" | Add-Content $log } else { "HSTS=(missing)" | Add-Content $log }
    $server = $resp.Headers['Server']
    if ($server) { "SERVER=$server" | Add-Content $log } else { "SERVER=(missing)" | Add-Content $log }
    $body = $resp.Content
    if ($body.Length -gt 500) { $body = $body.Substring(0,500) + '...' }
    "BODY=$body" | Add-Content $log
  } catch {
    "ERROR=$($_.Exception.Message)" | Add-Content $log
  }
}
notepad $log
```

**Expected:**

- Staging root: HTTP 200 + HSTS `max-age=31536000; includeSubDomains`
- Staging health: HTTP 200 + `database.status` ready
- Production root: HTTP 200 + same HSTS
- Production health: HTTP 200 + DB ready

---

## 9. Optional SSH read-only discovery commands â€” owner approval required

**Do not run in planning blocks.** Only when owner explicitly approves G49 execution with SSH read-only scope:

```text
# Read-only examples â€” no writes, no restarts
hostname
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
test -f /opt/dca/caddy/Caddyfile && echo CADDYFILE_EXISTS
ls -la /opt/dca/backups/Caddyfile.G54-HSTS.*.bak 2>/dev/null || true
```

Forbidden during G49: `docker compose up`, `reload`, `restart`, `migrate`, file edits, env reads that print secrets.

---

## 10. PASS criteria

G49 **PASS** requires all of:

1. Owner approval for G49 execution block recorded
2. Local repo clean (or explicitly scoped) and baseline docs read
3. Docs confirm production readiness **NO**; G54 **PASS**; G49/G50 not previously executed (or re-run justified)
4. All four public probes return HTTP 200
5. HSTS present on staging and production root responses
6. Both health endpoints report database **ready**
7. No production mutation occurred during G49
8. Evidence logs saved to `$env:TEMP`
9. G53 Â§4.1 blockers documented with current status (G49 does not require all blockers closed)

---

## 11. STOP criteria

Stop immediately and do **not** proceed to G50 or any deploy if:

- Any public probe fails (non-200, timeout, TLS error)
- HSTS missing on staging or production root
- Health endpoint reports database not ready
- Evidence contradicts docs (e.g. unexpected deploy, dirty tree without approval)
- Any forbidden action was required to â€œfixâ€ the proof
- SSH was used without owner read-only approval
- Operator cannot confirm production was not mutated during the block

---

## 12. Relationship to G50 production deploy

| | G49 | G50 |
|---|-----|-----|
| Purpose | Read-only proof / dry-run evidence | Production deploy gate (mutation) |
| Mutates production | **NO** | Yes (when approved) |
| Authorizes deploy | **NO** | Only after explicit owner approval **and** G49 PASS |
| Production readiness after gate | Still **NO** | May move toward YES only if all blockers closed |

**G49 PASS does not authorize G50.** G50 requires:

1. G49 PASS with evidence archived
2. Explicit owner approval for G50
3. Remaining G53 Â§4.1 blockers resolved or owner-accepted (rollback evidence, env separation, etc.)
4. Confirmed artifact/commit for promotion
5. Backup/rollback plan evidenced before mutation

---

## 13. Relationship to Puriva Launch

**Puriva Launch is a separate gate** from DCA OS Production v1 (G49/G50 path).

| Gate | Scope |
|------|--------|
| **DCA OS Production v1** (G49 â†’ G50) | Deploy safety, infrastructure, env separation, dry-run proof |
| **Puriva Client-Service Launch** | Live integration proofs + product workflow gates |

Clearing G49 (or even G50) does **not** authorize Puriva Launch. Puriva remains **blocked** until live proof gates pass: R2, GA/GSC, live AI, image generation, transactional notifications, and product workflow gates. See `deferred-scope-register.md` (archived reference; see Git history).

---

## 14. Current G54 baseline

G54 HSTS/proxy fix: **PASS** (2026-07-09).

| Item | Value |
|------|--------|
| Changed runtime file | `/opt/dca/caddy/Caddyfile` |
| Backup | `/opt/dca/backups/Caddyfile.G54-HSTS.20260709-073546.bak` |
| Reload scope | `dca-caddy` only |
| App/API/DB/schema/source | No changes |
| Staging root | HTTP/2 200 + HSTS |
| Production root | HTTP/2 200 + HSTS |
| Staging/production health | OK, database ready |

G54 cleared the HSTS/proxy blocker only. Production readiness remains **NO**.

---

## 15. Output format expected from G49 execution

At G49 closeout, produce a compact evidence block:

```text
G49 Production Dry-Run / Read-Only Proof
Date:
Operator:
Commit SHA:
Branch:

Local repo:
  git status:
  production readiness (docs): NO
  G54: PASS
  G49 prior execution: NO

Public probes:
  staging-root: HTTP ___ HSTS ___
  staging-health: HTTP ___ DB ___
  production-root: HTTP ___ HSTS ___
  production-health: HTTP ___ DB ___

G53 blockers (status only):
  1 HSTS: PASS (G54)
  2 Rollback evidence:
  3 Env separation:
  4 Credential storage:
  5 Tenant boundary:
  6 Integration truth:
  7 Dry-run: PASS (this gate) / FAIL
  8 Sequence: G49 before G50

Mutations during G49: NONE

Verdict: PASS / STOP

G50 authorized: NO
Puriva Launch authorized: NO
Production readiness: NO

Log paths:
  -
```

Docs-only closeout (if PASS): update [`docs/STATUS.md`](../STATUS.md) Â§ G49, operator runbook, and this file Â§1 Status â€” only after owner approves commit.

---

## Historical context

- **G48:** Production readiness planning PASS â€” production deploy ready NO.
- **G53:** Production safety plan approved â€” planning only.
- **G54:** HSTS/proxy fix PASS â€” blocker closed.
- **G49:** Public read-only probe evidence collected 2026-07-09 (Â§1.1); re-confirmed 2026-07-09 by Subagent B (Â§1.2). Full gate closure (owner approval sentence, Â§6.3 SSH discovery if desired) remains pending. Production readiness remains NO. G50 remains not executed.

## 16. Mega-block pre-production readiness session note (2026-07-09)

As part of a documentation/audit mega-block (2026-07-09), the four Â§6.2 public probes were re-run and recorded in Â§1.1. **Repo was dirty at mega-block start** (uncommitted `G49` + production safety docs from a prior partial session); no runtime mutation occurred during probe collection. This mega-block produced/aligned production safety pack docs and readiness audits. No commit, push, deploy, VPS mutation, migration, or secret access occurred during probe collection. This session did not obtain or record the specific owner-approval sentence required by Â§10 item 1 for a full G49 gate PASS; treat Â§1.1 as evidence for a future formal G49 closure, not as G49 closure itself.

## 17. Subagent B â€” G49 formal closure documentation task (2026-07-09)

Subagent B was scoped to docs-only closure documentation plus a fresh public read-only probe re-run (see Â§1.2). Task scope: Windows PowerShell public HTTPS probes only, no SSH, no repo code changes, no commit. Result: all four Â§6.2 probes PASS again (HTTP 200, HSTS present, DB ready on both health endpoints). **Formal G49 gate closure (Â§10 item 1 owner-approval sentence) is still NOT recorded.** G50 remains **NOT EXECUTED / NOT AUTHORIZED**. Production readiness remains **NO**. No commit was made by Subagent B; no environment mutation occurred.

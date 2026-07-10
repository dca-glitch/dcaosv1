# Staging Guard Sweep (G645)

**Status:** Docs-only truth sweep for G637–G648. Historical staging PASS is not standing authorization for further staging/VPS work.

**Context (G469–G708):** Local staging-readiness / pre-staging smokes remain safe substitutes. Remote staging mutation, live provider proofs on staging, and staging browser QA still require **fresh** explicit owner approval.

---

## 1. Staging truth

| Fact | Value |
|---|---|
| Historical proof | G46d/G47 PASS |
| Artifact context | `/opt/dca/staging-artifacts/5e1ea5a` |
| Staging host | `staging.digitalcubeagency.net` |
| Further staging action | Requires **fresh** explicit owner approval |
| G469–G708 remote staging | **Not authorized** by this docs lane |

---

## 2. Guarded commands

| Script | Required guard | Default without guard |
|---|---|---|
| `smoke:mvp:staging` | Explicit HTTPS `MVP_SMOKE_API_BASE_URL` on allowlisted staging host | Refuse / fail closed |
| `smoke:staging-security-baseline` | `DCA_SMOKE_REMOTE_TARGET=staging` | Refuse (no HTTP) |
| Optional prod health in baseline | `DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE=1` | Skip |
| `bootstrap:staging-admin` | Staging DB target + write-mode confirmation env | Refuse unsafe targets |

Guard unit coverage: `scripts/smoke-staging-security-baseline.guard.test.mjs`, `scripts/bootstrap-staging-admin.guard.test.mjs`.

---

## 3. Mutation-capable staging actions (owner-gated)

- Staging deploy / Docker compose apply
- Staging migrations
- Staging admin bootstrap write mode
- Caddy recreate / DNS changes
- Staging live provider proofs (AI, R2, WP, email, GA/GSC, image)
- Staging browser QA against remote host (including Client Portal G492-class)

---

## 4. Local substitutes (safe defaults)

| Need | Local substitute |
|---|---|
| Pre-staging discussion | `smoke:staging-readiness:local` (no VPS) |
| Broad local closeout | `smoke:pre-staging:local` / `smoke:production-readiness:local` |
| Config-shape integrations | `smoke:external-integrations-readiness:local` |

These do **not** prove staging environment parity.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

No staging remote commands run in this lane.

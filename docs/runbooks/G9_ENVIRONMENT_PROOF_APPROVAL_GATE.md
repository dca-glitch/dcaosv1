# G9 XL+ Environment Proof Approval Gate

**Status:** Planning only  
**Model for this doc:** GPT-5.4 mini  
**Purpose:** Create the approval gate, readiness dossier, and Sonnet-only execution blueprint for the next bounded environment proof.  
**Scope:** Local planning/documentation only. No VPS, SSH, remote DB, containers, Caddy, deploy, or production mutation.

Related:

- [`docs/STATUS.md`](../STATUS.md)
- [`docs/STATUS_COMPLETION.md`](../STATUS_COMPLETION.md)
- [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](./PURIVA_OPERATING_PACK_V1_GO_NO_GO.md)
- [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](./PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md)
- [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](./PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md)
- [`docs/operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md)
- [`docs/operator/client-delivery-sop.md`](../operator/client-delivery-sop.md)
- [`docs/operator/first-client-next-actions.md`](../operator/first-client-next-actions.md)
- [`docs/ai-delivery/client-delivery-readiness.md`](../ai-delivery/client-delivery-readiness.md)
- [`docs/modules/KNOWLEDGE_BASE.md`](../modules/KNOWLEDGE_BASE.md)
- [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](../modules/WORKFLOW_BRIEFS_MODULE_PLAN.md)
- [`docs/modules/SEO_MODULE_PLAN.md`](../modules/SEO_MODULE_PLAN.md)
- [`docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`](../ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md)
- [`docs/runbooks/PURIVA_SEO_PLAN_V1_GATE.md`](./PURIVA_SEO_PLAN_V1_GATE.md)
- [`docs/runbooks/PURIVA_CONTENT_PRODUCTION_V1_GATE.md`](./PURIVA_CONTENT_PRODUCTION_V1_GATE.md)
- [`docs/runbooks/PURIVA_MONTHLY_REPORT_V1_GATE.md`](./PURIVA_MONTHLY_REPORT_V1_GATE.md)
- [`docs/operator/client-wording-guide.md`](../operator/client-wording-guide.md)

---

## 0) Gate summary

**Current repo preflight:** `main` clean and synced with `origin/main`; latest commit `d31f5d0`; baseline already updated after Puriva Operating Pack v1.

**Local evidence already proven:** Puriva intake/compliance, AI Knowledge/context, WorkflowBriefs, SEO planning, content scaffolds, WordPress draft-only handoff, client-safe archive/report path, local E2E dry run, runner-control helper, and the operating-pack go/no-go layer.

**Environment proof status:** Not yet executed. This document only prepares the next owner-approved proof.

**Execution model:** actual environment execution must use **Sonnet**; this file is planning-only.

---

## 1) Local evidence review

### Proven locally

| Item | Proof source |
|---|---|
| Puriva intake/compliance source of truth | `PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md` |
| Owner/client approval checklist | `PURIVA_OPERATING_PACK_V1_GO_NO_GO.md` |
| Real client data packet checklist | `PURIVA_OPERATING_PACK_V1_GO_NO_GO.md` |
| Go/no-go checklist | `PURIVA_OPERATING_PACK_V1_GO_NO_GO.md` |
| AI Knowledge/context path | `docs/modules/KNOWLEDGE_BASE.md` |
| WorkflowBriefs intake-to-brief path | `docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md` |
| SEO/content production gate | `docs/modules/SEO_MODULE_PLAN.md`, `PURIVA_SEO_PLAN_V1_GATE.md`, `PURIVA_CONTENT_PRODUCTION_V1_GATE.md` |
| Content draft/compliance review path | `PURIVA_CONTENT_PRODUCTION_V1_GATE.md`, `PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md` |
| Image/asset handoff | `PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`, `client-delivery-sop.md` |
| WordPress prepared draft-only handoff | `docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md` |
| Client-safe approval/archive/report flow | `docs/ai-delivery/client-delivery-readiness.md`, `PURIVA_MONTHLY_REPORT_V1_GATE.md` |
| Client approval happy path | `PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md` |
| Local smoke/browser proof | `PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md` |
| Runner-control helper availability | `scripts/lib/runner-control.ps1` |
| Baseline table updated before environment work | `docs/STATUS.md`, `docs/STATUS_COMPLETION.md` |
| Explicit deferrals | live provider, live WordPress publish, GA/GSC, R2 live IO, production deploy |

### Not proven locally

- live provider execution
- live WordPress publish
- GA/GSC live sync
- R2 live IO
- production deploy
- production restart / rollback
- production health under a live mutation

### Proven only by docs/runbook

- environment proof boundaries
- backup/rollback requirements
- approval sentence
- phase plan
- evidence package template

### Requires environment proof

- host/container/routing snapshot
- health endpoints
- artifact/build marker on target environment
- admin bootstrap/data readiness on target environment
- client-safe smoke on target environment

### Requires production-specific approval later

- any production deploy
- any production DB write
- any production restart
- any production config change
- any production rollback
- any live integration enablement

---

## 2) Baseline readiness interpretation

| Area | Conservative interpretation |
|---|---|
| Local/admin-operational pack | Ready locally |
| Puriva intake/compliance path | Ready locally |
| AI Knowledge/context + WorkflowBriefs + SEO/content path | Ready locally |
| WordPress draft-only handoff | Ready locally, not live |
| Client-safe archive/report path | Ready locally, client-visible but not production-proven |
| Client approval happy path | Ready locally |
| Live AI provider / live WP / GA-GSC / R2 | Environment-unproven and deferred |
| Production deploy / restart / rollback | Not established |
| Production readiness | Not established |

**Do not inflate:** the local/admin readiness numbers do not imply production readiness. The pack is local/admin-operational; the environment proof only asks whether the same path works in a bounded target environment.

**Numbers that justify environment proof:** Puriva Operating Pack v1 at ~88% local/admin readiness, while global production readiness remains far lower and still deferred.

**Numbers that still block production readiness:** production readiness remains a separate owner gate; live integrations and production rollout remain unproven.

---

## 3) Readiness verdict

- **Ready for owner approval to request the next environment proof:** yes
- **Production readiness:** no
- **Purpose of environment proof:** validate the already-localized Puriva operating path in a bounded environment without expanding scope
- **What it validates beyond local:** host/routing identity, artifact placement, service health, environment-specific data/bootstrap readiness, and whether the same safe path survives outside the local workstation
- **What must not be interpreted as proven yet:** production deploy, live provider behavior, live WordPress publish, GA/GSC, R2 live IO, or rollback success unless separately executed and evidenced
- **What cannot be tested without live integrations:** live provider execution, live publish, live sync, live bucket IO
- **What should remain manual/admin-operated:** approval routing, client-safe review, final archive/report sign-off, and all live publish decisions
- **Minimum success definition:** read-only environment inventory + bounded smoke path pass + complete evidence package + no safety boundary breach
- **Maximum allowed scope:** one approved target environment, health-check-only production observation, no production mutation

---

## 4) Scope boundary table

| Area | In scope after explicit owner approval | Out of scope | Evidence required | Stop condition | Owner approval needed | Model required |
|---|---|---|---|---|---|---|
| Local repo preflight | Verify branch, sync, clean tree, latest commit | Any mutation | `git status`, `git log -1`, `git status -sb`, `git diff --check` | Dirty tree / wrong branch / old commit | No | GPT-5.4 mini |
| CI/main sync assumption | Confirm `main = origin/main` | Force sync / rewrite history | `git status -sb` | Not synced | No | GPT-5.4 mini |
| Artifact/build verification | Read-only artifact/build marker checks | Rebuild in target env unless approved | build hash / artifact path / checksum | Missing artifact | No | Sonnet |
| Environment snapshot/read-only checks | Host, compose, ports, Caddy, health, images, disk, backups | Any mutation | read-only inventory log | Missing inventory | No | Sonnet |
| DB backup/snapshot | Pre-mutation backup verification | Mutating DB without backup | backup path + size + timestamp | Backup absent or unverified | Yes | Sonnet |
| Config/Caddy backup | Backup before config/routing changes | Config mutation without backup | config backup path | Backup absent or unverified | Yes | Sonnet |
| App service update/restart | Only approved service update/restart | Production deploy / broad restart | before/after service snapshot | Service mismatch or health failure | Yes | Sonnet |
| Admin bootstrap/data readiness | Approved bootstrap only | Secret printing / unapproved bootstrap | readiness log + env presence only | Missing admin data readiness | Yes | Sonnet |
| Puriva data readiness | Verify client facts, approvals, safety notes | New schema / live provider / live publish | data matrix evidence | Missing client facts or approval route | Yes | Sonnet |
| Auth/admin readiness | Login, roles, tenant isolation, boundary checks | Password inspection or secret logging | auth readiness evidence | Any exposure or auth uncertainty | Yes | Sonnet |
| AI Knowledge/context readiness | Safe approved knowledge only | Raw intake promotion without review | context preview evidence | Untrusted context leakage | Yes | Sonnet |
| WorkflowBriefs readiness | Brief/plan/production-plan handoff | Client-visible internal metadata | workflow proof evidence | Sanitation or plan mismatch | Yes | Sonnet |
| AI Delivery workflow smoke | End-to-end local-approved workflow path | Live AI provider, broad refactor | smoke logs | First smoke failure | Yes | Sonnet |
| Client approval smoke | Review-safe approval happy path | Public approval links / comments expansion | browser proof | Leakage or approval mismatch | Yes | Sonnet |
| Monthly report/archive smoke | FINAL-only archive/report path | GA/GSC live sync | smoke/browser proof | Final-only filter fails | Yes | Sonnet |
| WordPress prepared draft-only check | Draft payload only | Live publish, credential print | draft payload evidence | Any publish behavior | Yes | Sonnet |
| Production health-only safety check | Read-only health endpoint only | Deploy, restart, write, config change | health evidence only | Any mutation or regression | Yes | Sonnet |
| Docs closeout later | Record evidence and commit docs only | Environment changes | diff review + docs log | Non-doc changes appear | No | GPT-5.4 mini |

**Out of scope must include:** production deploy, production DB write, production restart, production config change, live AI provider, live WordPress publish, GA/GSC live sync, R2 live IO, broad refactor, schema/API/auth changes unless separately approved, client portal feature expansion, billing/payment integrations, autonomous agents/queues.

---

## 5) Environment inventory discovery plan

Read-only only; capture:

1. host identity
2. current working directory / environment root
3. relevant compose files
4. running containers/services
5. exposed ports
6. health endpoints
7. Caddy / routing status
8. current image IDs / tags
9. current commit / artifact marker if available
10. DB container health
11. disk space
12. backup directory presence
13. environment variable **presence only** (no values)
14. previous artifact / backup paths documented in repo

**Do not run now.** Presence-only language only.

---

## 6) Required backups / snapshots

| Requirement | Evidence |
|---|---|
| Local repo status clean | `git status --short --branch` |
| Current commit hash | `git log -1 --oneline` |
| Remote branch sync | `git status -sb` |
| Service/container snapshot | read-only inventory log |
| Image/container IDs | read-only inventory log |
| DB backup before mutation | timestamped backup path |
| DB backup verification | size + path + checksum/verification note |
| Config/Caddy backup | timestamped config backup path |
| Compose/env backup if touched | backup path and diff note |
| Artifact/build path evidence | artifact directory path + marker |
| Production health baseline (if health-only) | read-only health response |
| Rollback target captured first | previous image/commit/config reference |
| Backup location paths | explicit path list |
| Timestamp naming convention | `YYYYMMDD-HHMMSS` style |
| Stop rule | do not proceed if backup cannot be verified |

---

## 7) Data readiness matrix

| Data area | Required for proof | Current local source | Environment source expected | Safe to create/update after approval | Client-visible | Stop condition |
|---|---|---|---|---|---|---|
| Tenant / client / project | Proof context | repo docs / local seed | target env seed / fixtures | Yes | No | Wrong client/project |
| Admin user | Auth proof | local admin seed | target env admin seed | Yes | No | Admin login fails |
| Client user if needed | Client boundary proof | local client seed | target env client seed | Maybe | Yes | Client boundary unclear |
| Membership / RBAC | Access checks | local role model | target env role model | Yes | No | Role mismatch |
| Puriva facts | Compliance proof | intake source of truth | approved target env context | Yes | Maybe | Unverified fact appears |
| Services | Planning context | intake source of truth | approved target env context | Yes | Maybe | Unsupported service used |
| Claims / disclaimers | Compliance proof | compliance source | approved target env context | Yes | Maybe | Prohibited claim appears |
| Approval contacts | Route proof | operating pack | approved target env contacts | Yes | No | No approval route |
| Brand / content prefs | Draft readiness | operating pack | approved target env context | Yes | Maybe | Conflicting direction |
| AI Knowledge entries | Context proof | local approved knowledge | target env approved knowledge | Yes | No | Raw intake leaks |
| WorkflowBrief | Workflow proof | local brief seed | target env brief seed | Yes | No | Brief incomplete |
| SEO plan | Planning proof | SEO gate | target env plan seed | Yes | Maybe | Plan not grounded |
| Content draft | Draft proof | content production gate | target env draft seed | Yes | Maybe | Draft not compliance-reviewed |
| Image / asset handoff | Packaging proof | local dry run | target env assets | Yes | Maybe | Rights or source unclear |
| WordPress prepared draft metadata | Handoff proof | prepared draft foundation | target env draft metadata | Yes | No | Live publish leakage |
| Monthly report / archive | Client-safe proof | monthly report gate | target env archive/report | Yes | Yes | Non-final data visible |
| Approval / review records | Go/no-go proof | operating pack | target env review log | Yes | Maybe | Approval state ambiguous |

---

## 8) Auth / admin readiness matrix

| Check | Purpose | Expected safe evidence | Secret handling | Stop condition |
|---|---|---|---|---|
| Admin login readiness | Confirm admin access works | successful authenticated response / browser login | password only via approved temp env/process later | login fails or password needed to be printed |
| Client portal access boundary | Confirm client-only vs admin-only separation | client route allowed, admin route blocked | no secrets | boundary leaks |
| Tenant isolation | Ensure the correct tenant is addressed | tenant-scoped IDs in read-only proof | no secret values | wrong tenant exposed |
| Role / membership check | Confirm role gating | role claims / access responses | no secret values | role mismatch |
| No storageKey/internal exposure | Prevent leakage | sanitized payloads only | no logs of raw payloads | internal fields visible |
| No provider/job/run leakage | Protect internal runtime details | no provider metadata in client surfaces | no logs of runtime internals | runtime metadata visible |
| Password/env handling | Prevent secret disclosure | env presence only | values never printed | any secret printed |
| Turnstile local-vs-environment distinction | Keep local proof separate from environment proof | documented distinction only | no secret values | assumption of live Turnstile |
| Login rate-limit awareness | Avoid false failures | note rate-limits in log | no secret values | rate-limit regression or lockout |
| Logout/session safety | Confirm safe session teardown | browser/session evidence | no secret values | stale session remains active |

---

## 9) Client-safe boundary matrix

| Surface | Client can see | Client must not see | Evidence/check | Stop condition |
|---|---|---|---|---|
| Client portal home/archive | final deliverables, monthly reports | internal drafts, logs, internal notes | browser proof | draft leakage |
| Pending approvals | review-safe items only | internal workflow notes | access check | internal metadata exposed |
| Article approval editor | approved/review-safe content | provider/run internals | approval smoke | raw internals visible |
| Monthly report | FINAL-only summary | draft/report scaffolds | FINAL-only proof | non-final items visible |
| Final deliverables | approved output | unapproved drafts | archive proof | unapproved content visible |
| Export/download links | safe manual export links | `storageKey`, raw paths | download contract proof | internal paths exposed |
| Internal events / audit logs | none | all internal events | role check | any internal event exposed |
| AI Knowledge/context | none | knowledge bodies, context internals | admin-only visibility check | any raw knowledge exposed |
| Provider/job/run metadata | none | execution logs, model ids, runtimes | client-safe sanitization | runtime metadata leaks |
| StorageKey/private paths | none | private paths | response inspection | private path exposed |
| Admin-only Puriva intake facts | none | raw intake notes | workflow admin-only check | intake notes exposed |
| Raw claims/compliance notes | none | unreviewed claims | compliance gate | unreviewed claim visible |

---

## 10) WordPress draft-only matrix

| Step | Current allowed behavior | Forbidden behavior | Evidence | Stop condition |
|---|---|---|---|---|
| Prepared draft only | create a local draft payload | publish or schedule live content | draft foundation proof | any live publish behavior |
| No live publish | stay draft-only | hit WordPress live API | request/response proof | live API called |
| No production WordPress mutation | leave production untouched | publish, update, delete remote posts | read-only contract proof | any production mutation |
| No credential printing | keep secrets out of logs | emit secrets to logs | log review | any credential appears |
| Compliance-reviewed handoff | only after review | bypass compliance | review notes | unreviewed draft handed off |
| Final-safe client view | client sees review/final-safe output only | client sees prepared scaffold internals | portal/browser proof | draft internals leak |
| Publish remains admin decision | admin decides later | auto-publish | SOP proof | publish decision automated |

---

## 11) Live integration deferral matrix

| Integration | Current status | Why deferred | What would be required later | Current safe substitute |
|---|---|---|---|---|
| Live AI provider | deferred | external runtime/cost/secret risk | separate approved provider block | local deterministic planning |
| Live WordPress publish | deferred | credential + rollback design needed | secure API contract and live publish block | prepared draft-only handoff |
| GA/GSC | deferred | live OAuth/reporting risk | approved analytics block | placeholder metrics / manual notes |
| R2 live IO | deferred | bucket write/read risk | approved storage block | guarded local/default-safe paths |
| Email / notifications | deferred unless explicitly needed | delivery and queue risk | approved send block | read-only outbox / admin notes |
| Payments / revenue | deferred | business/finance risk | approved finance block | admin records only |
| Scraping / crawling | deferred | legal/operational risk | approved crawler block | manual research/context only |
| Queues / autonomous agents | deferred | cost/runtime drift | approved automation block | manual/admin-operated flow |

---

## 12) Phase-by-phase execution blueprint

### Phase 0 — Local preflight
- verify branch / status / latest commit
- verify `main = origin/main`
- verify baseline table was already updated
- verify no local changes
- verify expected runbooks exist
- stop if dirty

### Phase 1 — Read-only environment inventory
- capture host/service/container/routing status
- capture health endpoints
- capture image/container identifiers
- capture disk space
- no mutation

### Phase 2 — Artifact/build verification
- verify target commit / artifact marker
- verify build/check where required
- no production touch

### Phase 3 — Backup gate
- DB backup before any mutation
- config/compose backup if relevant
- verify backup exists and is non-empty
- owner approval still required
- stop if backup fails

### Phase 4 — Controlled environment update
- only after explicit owner approval
- approved environment only
- no production deploy
- no production DB write
- production health-only check allowed
- stop on first failure

### Phase 5 — Admin/Puriva data readiness
- only after explicit owner approval
- no secrets printed
- use existing bootstrap/data readiness scripts if available
- verify admin/Puriva/client-safe data path
- stop on first failure

### Phase 6 — Puriva E2E smoke
- run approved checks only
- no live provider
- no live WordPress publish
- no GA/GSC
- no R2 live IO
- verify client-safe boundaries
- stop on first failure

### Phase 7 — Production health-only safety check
- health endpoint only
- no deploy
- no DB write
- no restart
- no config changes
- stop and report if regression

### Phase 8 — Evidence package
- logs
- smoke results
- backup paths
- rollback target
- final status
- changed services
- untouched services
- exact commit

### Phase 9 — Go/no-go decision
- environment proof PASS/FAIL
- production readiness still separate
- list deferred work
- owner decision required for next step

### Phase 10 — Docs closeout later
- docs-only
- commit/push only after review
- no environment work in closeout

---

## 13) Smoke / check matrix

| Check | Purpose | Local equivalent already proven | Environment proof target | Command/script to use if known | Required evidence | Stop on fail | Notes |
|---|---|---|---|---|---|---|---|
| Repo status check | confirm clean/synced repo | yes | same | `git status`, `git status -sb` | log output | yes | phase 0 |
| Health check | read-only env health | local health patterns | target env health endpoints | existing repo pattern | health response | yes | production health-only |
| Admin login/auth readiness | access proof | local auth smokes | target env auth readiness | existing auth smoke pattern | authenticated proof | yes | password never printed |
| Admin operations smoke | admin summary and boundaries | yes | target env admin ops | existing repo smoke | smoke log | yes | local/admin baseline |
| Puriva readiness smoke | end-to-end operational proof | yes | target env Puriva readiness | existing repo smoke | smoke log | yes | bounded scope |
| WorkflowBriefs handoff smoke | brief/plan readiness | yes | target env workflow smoke | existing repo smoke | smoke log | yes | client-safe only |
| AI Delivery workflow smoke | workflow chain proof | yes | target env delivery smoke | existing repo smoke | smoke log | yes | no live provider |
| AI Delivery reviews smoke | review/archive path | yes | target env review smoke | existing repo smoke | smoke log | yes | no leakage |
| Client portal monthly report smoke | FINAL-only archive/report | yes | target env monthly report smoke | existing repo smoke | smoke log | yes | no drafts visible |
| Client approval happy path smoke | review/approve path | yes | target env approval smoke | existing repo smoke | smoke log | yes | approvals only |
| Client portal boundary/leakage check | no internal exposure | yes | target env boundary smoke | existing repo smoke | response diff | yes | stop on any leak |
| WordPress prepared draft check | draft-only handoff | yes | target env draft proof | existing repo smoke | draft payload log | yes | no publish |
| No live provider check | ensure disabled state | yes | target env config/readiness | existing repo pattern | readiness log | yes | no provider calls |
| No live WordPress publish check | ensure publish off | yes | target env config/readiness | existing repo pattern | readiness log | yes | no publish |
| Production health-only check | observe only | not production mutation | production health endpoint only | existing repo pattern | health response only | yes | no mutations |
| Final git/status/log evidence | preserve proof | yes | same | runner-control + git | log path + commit | yes | closeout later |

If a command is unknown, use the existing repo script/pattern and discover read-only first.

---

## 14) Risk and stop-condition matrix

| Risk | Severity | Trigger | Early detection | Stop condition | Recovery / rollback evidence | Owner decision needed |
|---|---|---|---|---|---|---|
| Local working tree dirty | high | uncommitted files | `git status` | yes | revert/cleanup log | yes |
| Wrong branch | high | not on `main` | `git branch --show-current` | yes | branch correction log | yes |
| Main not synced | high | `main != origin/main` | `git status -sb` | yes | sync evidence | yes |
| Wrong target commit | high | commit older than `d31f5d0` | `git log -1` | yes | commit pin log | yes |
| Environment not clean | high | stale services or unknown state | inventory snapshot | yes | before/after snapshot | yes |
| Backup failure | critical | no verified backup | backup evidence | yes | backup path | yes |
| DB backup unverified | critical | missing/non-empty proof | backup check | yes | DB backup path | yes |
| DB migration/data mismatch | critical | unexpected schema/data | diff/state check | yes | restore path | yes |
| Admin bootstrap issue | high | bootstrap fails | bootstrap log | yes | bootstrap evidence | yes |
| Auth/RBAC issue | critical | wrong role/access | auth smoke | yes | auth log | yes |
| Client leakage risk | critical | internal fields exposed | boundary smoke | yes | sanitized response proof | yes |
| Internal field exposure | critical | storageKey/run metadata visible | response inspection | yes | sanitization evidence | yes |
| Smoke failure | high | any smoke fails | smoke logs | yes | first-failure log | yes |
| Production health regression | critical | health degraded | read-only health check | yes | health baseline | yes |
| Caddy/routing mismatch | high | wrong root/route | routing snapshot | yes | config/route evidence | yes |
| Stale artifact | high | wrong build/commit marker | artifact marker | yes | build marker | yes |
| Disk space issue | medium | low disk free | inventory snapshot | yes | disk evidence | yes |
| Live provider enabled accidentally | critical | provider returns live | readiness check | yes | config proof | yes |
| Live WordPress publish triggered | critical | publish call occurs | request log | yes | draft-only proof | yes |
| GA/GSC triggered | critical | analytics sync occurs | config/readiness check | yes | disabled proof | yes |
| R2 live IO triggered | critical | bucket read/write occurs | readiness check | yes | disabled/guard proof | yes |
| Secrets printed | critical | logs contain values | log review | yes | sanitized logs | yes |
| Logs incomplete | medium | missing evidence path | log audit | yes | full log path | yes |
| Rollback target missing | critical | no rollback anchor | rollback plan | yes | target capture | yes |
| Working tree dirty during docs closeout | medium | unexpected edits | `git status` | yes | status log | yes |

---

## 15) Rollback model

1. rollback is planned before any mutation
2. rollback target is captured before mutation
3. DB restore path is identified before DB mutation
4. service/container/image rollback target is captured
5. config rollback target is captured if config is touched
6. health check is run before and after rollback
7. rollback success requires evidence: before/after state, health, and clean rollback target
8. stop if rollback evidence is missing
9. production rollback is out of scope because production deploy is out of scope
10. destructive rollback still needs owner approval

**Success evidence:** previous commit/image/config reference, restore path, health response after rollback, and confirmed untouched services outside scope.

---

## 16) Evidence package template

- run name
- date/time
- operator
- target environment
- target commit
- repo status
- backup paths
- artifact/build evidence
- service/container before snapshot
- service/container after snapshot
- DB backup evidence
- smoke results
- production health-only result
- final environment status
- failures / stops
- rollback target
- deferred items
- owner decision needed
- final verdict

---

## 17) Go / no-go decision board

| Gate | Required evidence | PASS criteria | FAIL criteria | Owner decision |
|---|---|---|---|---|
| Local repo gate | clean + synced repo | main clean and pinned | dirty / unsynced | approve or stop |
| Backup gate | verified backup | backup exists and is non-empty | missing backup | approve or stop |
| Artifact gate | build marker / artifact path | expected marker present | wrong/missing artifact | approve or stop |
| Auth/admin gate | auth proof | admin login and boundary pass | login or boundary fail | approve or stop |
| Puriva data gate | client facts / approvals | verified facts and route | unverified or missing | approve or stop |
| AI Delivery gate | workflow smoke | approved chain passes | smoke failure | approve or stop |
| Client-safe gate | leakage checks | no internal fields exposed | any leak | approve or stop |
| Monthly report/archive gate | FINAL-only proof | final-only archive/report | drafts exposed | approve or stop |
| WordPress draft-only gate | draft payload proof | draft-only, no publish | publish leakage | approve or stop |
| Production health-only gate | health response only | read-only health normal | mutation or regression | approve or stop |
| Evidence package gate | complete log pack | full evidence captured | incomplete evidence | approve or stop |
| Closeout gate | reviewable docs | docs-only closeout ready | non-doc drift | approve or stop |

---

## 18) Owner approval required

**Exact approval sentence:**

> “I approve G9 environment proof execution on [target environment only], with production limited to health-check only, no production deploy, no production DB writes, no production restart, no production config changes, no live AI provider, no live WordPress publish, no GA/GSC sync, no R2 live IO, stop on first failure, and backup/rollback evidence required before any mutating action.”

**Fill-in approval fields**

- target environment:
- target commit:
- allowed mutation window:
- operator:
- emergency rollback approval: yes/no

---

## 19) Ready-to-paste Sonnet execution prompt

```text
MODEL: Sonnet required

DCA mode. Repo: C:\dcaosv1. Branch: main.

Current state:
- main is expected clean and synced with origin/main
- latest known commit: d31f5d0 docs: record Puriva operating pack v1 closeout
- baseline table already updated for Puriva Operating Pack v1
- no environment work has been executed yet

Owner approval requirement:
- Do not start unless the exact approval sentence below is present:
  “I approve G9 environment proof execution on [target environment only], with production limited to health-check only, no production deploy, no production DB writes, no production restart, no production config changes, no live AI provider, no live WordPress publish, no GA/GSC sync, no R2 live IO, stop on first failure, and backup/rollback evidence required before any mutating action.”

Hard limits:
- Production is health-check only
- No production deploy
- No production DB write
- No production restart
- No production config change
- No live AI provider
- No live WordPress publish
- No GA/GSC
- No R2 live IO
- No secrets printed
- No commit/push unless a later docs-only closeout is explicitly approved

Use existing repo scripts/patterns only. Use scripts/lib/runner-control.ps1. Log all commands to $env:TEMP and open the log in Notepad.

Before any mutation:
- capture read-only environment inventory
- capture backup/snapshot evidence
- capture rollback target evidence
- stop if inventory or backup evidence is incomplete

Execute only the approved phases:
1. Local preflight
2. Read-only environment inventory
3. Artifact/build verification
4. Backup gate
5. Controlled environment update
6. Admin/Puriva data readiness
7. Puriva E2E smoke
8. Production health-only safety check
9. Evidence package
10. Go/no-go decision

Use the smoke/check matrix and risk matrix from docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md.
Stop on first failure.

Final output must include:
- target environment
- target commit
- what changed
- what stayed untouched
- backup evidence
- rollback target
- smoke results
- production health-only result
- deferred work
- exact next recommendation
```

---

## 20) Ready-to-paste post-run closeout prompt

```text
MODEL: GPT-5.4 mini

DCA mode. Repo: C:\dcaosv1. Branch: main.

This is docs-only closeout for the completed G9 environment proof.

No environment work.
No VPS/SSH.
No remote DB.
No containers.
No Caddy.
No production changes.

Record only:
- evidence paths
- smoke results
- backup/rollback evidence
- production health-only result
- untouched services
- deferred work

Use scripts/lib/runner-control.ps1. Log to $env:TEMP and open in Notepad.
Use git diff --check before any commit.
Do not claim production readiness unless separately approved.
Commit/push only after review passes and only if the closeout is docs-only.

Post-run closeout must include:
- target environment
- target commit
- repo status
- evidence package summary
- PASS/FAIL decision
- next recommendation
```

---

## 21) Optional docs-only approval / run-plan file

Use this file as the approval gate and run-plan reference:

- `docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`

It is planning-only and does not imply the environment proof already happened.

---

## 22) Exact next recommendation

Wait for explicit owner approval using the exact approval sentence above. Do not start any environment work, backup, or smoke until that approval is present.

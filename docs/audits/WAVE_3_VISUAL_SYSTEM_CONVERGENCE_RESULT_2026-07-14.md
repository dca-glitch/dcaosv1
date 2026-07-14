# WAVE 3 â€” Visual-System Convergence Result

**Gate:** `WAVE_3_VISUAL_SYSTEM_CONVERGENCE`
**Date:** 2026-07-14
**Baseline HEAD / origin/main:** `1194026520233799be6c379a35448c777aeb7851`
**Commit / push / staging / production:** none (implementation left unstaged for owner review)

---

## 1. Classification legend used below

| Tag | Meaning |
|-----|---------|
| `CLOSED_BY_CURRENT_MAIN` | Already correct on tip before this wave |
| `IMPLEMENTED_IN_WAVE_3` | Fixed or contracted in this wave |
| `VERIFIED_NO_CHANGE_REQUIRED` | Assessed; intentionally unchanged |
| `DEFERRED_NON_BLOCKING` | Real residual; not required to close this gate |
| `OUT_OF_SCOPE_WAVE_4` | Tables / product IA / Card / DS Layout / broader polish |
| `OWNER_DECISION_REQUIRED` | Needs product owner choice |

---

## 2. Assessment counters (pre-implementation)

```text
CONFIRMED_WAVE_3_DEFECTS=11
CONFIRMED_STATUS_BADGE_MISUSES=4
CONFIRMED_MANUAL_STATUS_PILLS=4
CONFIRMED_CLIENT_SAFE_DEFECTS=3
CONFIRMED_DIRECT_PRIVATE_STATUS_IMPORTS=2
DOC_DRIFT_ITEMS=5
```

---

## 3. Contract changes (`IMPLEMENTED_IN_WAVE_3`)

### Public `StatusBadge` (`components/ui/StatusBadge.tsx`)

- `status` drives tone, token style, and `data-status`
- Known keys use canonical `STATUS[key].label`
- Unknown â†’ `data-status="unknown"` + title-cased fallback + neutral visual
- Optional `displayLabel` overrides **text only** (never tone)
- `className` preserved
- No local status color literals

### Private DS `StatusBadge`

- Aligned `displayLabel` + `data-status` fallback for foundation consistency (thin parity, not a second registry)

### Status aliases

- Added mapper aliases required so enum keys (not display strings) resolve tone: `submitted`, `client_review_requested`, `client_approved`, `client_changes_requested`, preview/final-ready synonyms

### Client portal

- `ClientPortalStatusBadge` LABEL_FIRST path: `StatusBadge status={raw} displayLabel={label}`

---

## 4. Migrated call sites (`IMPLEMENTED_IN_WAVE_3`)

| Surface | Change |
|---------|--------|
| BriefPage / BriefPanelPage | Lifecycle `BriefStatusBadge` â†’ `StatusBadge` + presentation `displayLabel` |
| ArchiveHub briefs + articles | Badgeâ†’StatusBadge; article tone from raw status + archive label |
| ClientDashboard recent briefs | Badgeâ†’StatusBadge |
| ArticleApprovalEditor image status | Raw approval status + client display label |
| AI Delivery deliverable / draft / plan / image modals | Raw enum `status` + formatter `displayLabel` |
| MonthlyReportPanel shell status | Raw report status + shell/format label |
| TasksPage | Raw task status (+ archived) + formatted label |
| AiOperationsPage context chip | Lifecycle StatusBadge misuse â†’ generic `Badge` (metadata) |
| client-portal-status / adminDailyOperationsModel | Import `design-system/status` â†’ `components/ui` |
| Import guard | New rule `ds-status-registry`; self-tests 10â€“12 |

---

## 5. Intentionally left on `Badge` / StatusBadge patterns (`VERIFIED_NO_CHANGE_REQUIRED`)

| Site | Why |
|------|-----|
| AdminDailyOperationsCockpit Waiting / Unknown / Deferred | Non-canonical / gating chips â€” generic Badge |
| Projects / Invoices / Bills / Clients health | Already pass enums into StatusBadge |
| Client portal delivery rows | Already `ClientPortalStatusBadge` |
| Category/metadata StatusBadge (ClientHub OWN_DOMAIN, MI findingCategory) | Opposite-direction polish; not lifecycle defects |
| Proof-ish readiness labels on AdminOperations / Orchestrator | Admin config chips; no new proof-state primitive |
| Manual `entity-pill` Active/Archived | Deferred non-blocking residual |

---

## 6. Already closed before Wave 3 (`CLOSED_BY_CURRENT_MAIN`)

- Cockpit dominant `primaryStatus` (no comma-joined statuses)
- Portal content-plan / delivery via `ClientPortalStatusBadge`
- Modal public API + import allowlist **0**
- Wave 1/2 visual callout + muted Option B runtime tokens
- Create-status deliverable policy

---

## 7. Docs synced (`IMPLEMENTED_IN_WAVE_3`)

- `DESIGN_SYSTEM_SPEC.md`: `T.muted` / archived tokens â†’ `#7F89A8` + archived rgba; Badge vs StatusBadge + `displayLabel`; proof-state boundary
- `CANONICAL_COMPONENT_SYSTEM.md`: `ds-status-registry` guard; Visual Wave 3 vs empty/loading clone â€œWave 3â€ naming

---

## 8. Deferred / out of scope

| Item | Tag |
|------|-----|
| Remaining `entity-pill` status shells in AI Delivery pickers/workspace | `DEFERRED_NON_BLOCKING` |
| Category chips still on StatusBadge (MI / ClientHub) | `DEFERRED_NON_BLOCKING` |
| Card adapter, DS Layout activation, table visual migration | `OUT_OF_SCOPE_WAVE_4` |
| Product modal IA (UX-01), client portal section duplication | `OUT_OF_SCOPE_WAVE_4` / product |
| Optional Badge geometry alignment with status pills | `DEFERRED_NON_BLOCKING` / owner |

---

## 9. Validation

| Check | Result |
|-------|--------|
| Focused StatusBadge + ClientPortalStatusBadge unit tests | PASS (22) |
| Related web unit suites (ui / portal / ai-delivery / ops / tasks) | PASS (250) |
| Import guard | PASS; allowlist **0**; `ds-status=0` |
| Import guard `--self-test` | PASS (13/13) |
| `git diff --check` | PASS |
| `npm.cmd run validate` | PASS |
| `smoke:client-portal:browser` | PASS |
| `smoke:client-portal:empty-archive:browser` | PASS |
| `smoke:monthly-report:browser` | PASS (after Withdrawn/Deferred â†’ Badge fix) |
| `smoke:ai-operations:browser` | PASS |
| `smoke:client-safe-ai-visibility:local` | PASS (admin boundary; tester email skip) |
| RUNTIME_VERIFICATION_BLOCKED | no (local API/web started for smokes) |

---

## 10. Safety

- No commit / push / staging / production
- Owner untracked files preserved (SHA-256 verified unchanged)
- HEAD remains `1194026520233799be6c379a35448c777aeb7851`
- Wave 3 tracked changes + new files left **unstaged** for owner review
- New Wave 3 untracked: `ClientPortalStatusBadge.test.tsx`, `WAVE_3_VISUAL_SYSTEM_CONVERGENCE_RESULT_2026-07-14.md`

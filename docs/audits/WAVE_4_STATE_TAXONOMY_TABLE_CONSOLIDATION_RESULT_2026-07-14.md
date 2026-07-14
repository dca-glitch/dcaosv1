# WAVE 4 - State Taxonomy and Table Consolidation Result

**Gate:** `WAVE_4_STATE_TAXONOMY_TABLE_CONSOLIDATION`
**Date:** 2026-07-14
**Baseline HEAD / origin/main:** `284915aba7aae45dcb0a61fd801fd2a652c9eeeb`
**Landed tip (post-commit):** `e0ddcee263a31d3698894b6a1190e42ab16fae9d`
**Commit / push / staging / production:** implementation committed as `e0ddcee` on `main` after owner review (this report content predates that commit textually)

---

## 1. Starting baseline

| Check | Result |
|-------|--------|
| Branch | `main` |
| HEAD (at wave start) | `284915aba7aae45dcb0a61fd801fd2a652c9eeeb` |
| origin/main | same at wave start |
| Tracked tree at start | clean |
| Staged | 0 |
| Latest tip at wave start | `284915a feat(ui): complete Wave 3 visual-system convergence` |

Owner-untracked inventory (11 paths) SHA-256 recorded; preserved end-to-end during wave implementation.

---

## 2. Assessment counters (pre-fix)

```text
CONFIRMED_WAVE_4_DEFECTS=14
CONFIRMED_STATE_CLONES=6 families (~AiDelivery empty core + handwritten residuals)
CONFIRMED_STATE_SEMANTIC_MISUSES=5
CONFIRMED_TABLE_API_DUPLICATIONS=3
CONFIRMED_RAW_HTML_TABLES=4 surfaces
CONFIRMED_DOUBLE_SCROLL_WRAPPERS=4 page groups
CONFIRMED_MOBILE_TABLE_DEFECTS=7
CONFIRMED_PAGINATION_DUPLICATIONS=1 (API surface only; single live paginator)
CONFIRMED_TABLE_A11Y_DEFECTS=6
```

---

## 3. CLOSED_BY_CURRENT_MAIN

- High-traffic CRM/finance LoadingState / EmptyState / ErrorState triad
- Wave 2 AI Delivery thin Loading/Alert wrappers
- Import allowlist **0**; pages do not import private DS Table
- Visual Wave 3 StatusBadge closed - not reopened
- Finance-lite overflow restore already mitigated Invoices/Bills/Credit Notes clip partially

---

## 4. Implemented fixes (`IMPLEMENTED_IN_WAVE_4`)

| # | Fix |
|---|-----|
| 1 | `.table-wrap` removed from card `overflow: hidden` group; dedicated `overflow-x: auto` scrollport |
| 2 | `.monthly-report-table-scroll` CSS implemented |
| 3 | DS Table: labeled scrollport `role="region"` + `tabIndex={0}` |
| 4 | DS TablePagination live region includes range + page |
| 5 | EmptyState: message-only inline; `data-empty-kind` contract |
| 6 | `AiDeliveryInlineEmpty` -> EmptyState adapter (exact copy preserved) |
| 7 | Projects / Tasks / Bills filtered vs first-use empty branching |
| 8 | ClientAccessPanel filtered vs first-use empty |
| 9 | FirstRunSetupPage Empty -> ErrorState for setup errors |
| 10 | aria-label moved onto Table / raw tables (Tasks, Bills, Credit Notes, App members, MI, Monthly Report, Knowledge) |
| 11 | Knowledge table: `table-wrap` + sr-only Actions header |
| 12 | Docs: CANONICAL + DESIGN_SYSTEM_SPEC state/table taxonomy |
| 13 | Focused tests: Table, TablePaginationBar, expanded state primitives |
| 14 | Import-guard self-tests 13-14 (DS Table deep fail; ui barrel state/table pass) |

---

## 5. Intentionally unchanged

| Item | Rationale |
|------|-----------|
| Invoices CompoundTable | Already correct compound interactive pattern |
| Raw AI Delivery dashboard table | Contained scroll; migration not blocking |
| Shell NotificationPanel custom empties | Residual DEFERRED_NON_BLOCKING |
| App / portal leftover `inline-empty` paragraphs | Residual polish after AiDelivery core migration |
| SortControls / BulkActionToolbar unused exports | Keep for operational toolkit; zero-importer product use |
| table-layout:fixed redesign | DEFERRED - densest tables usable after scroll clip fix |
| Wave 3 lifecycle StatusBadge | Out of scope |

---

## 6. Validation

| Check | Result |
|-------|--------|
| Focused Table/state/pagination unit tests | PASS (13) |
| Import guard | PASS; allowlist **0** |
| Import guard `--self-test` | PASS (15/15) |
| Web check / build | PASS |
| `git diff --check` | PASS |
| `npm.cmd run validate` | PASS |
| `smoke:ai-operations:browser` | PASS |
| `smoke:finance-admin:browser` | PASS |
| `smoke:monthly-report:browser` | PASS |
| `smoke:client-portal:browser` | PASS |
| `smoke:projects-tasks:local` | PASS |
| RUNTIME_VERIFICATION_BLOCKED | no |

---

## 7. Residuals / out of scope

| Item | Tag |
|------|-----|
| Remaining handwritten empties (NotificationPanel, App members empty copy, WorkflowBriefs muted) | DEFERRED_NON_BLOCKING |
| Nested outer+DS scroll on finance/MI (mitigated clip; dual layer remains) | DEFERRED_NON_BLOCKING |
| Card adapter / DS Layout / Modal IA | OUT_OF_SCOPE |
| Mechanical migration of all raw HTML tables | DEFERRED_NON_BLOCKING |

---

## 8. Safety

- Staging / production not mutated by Wave 4
- Owner untracked files preserved during wave
- Closeout residual markers kept accepted non-blocking

---

## Wave 4 closeout residual markers

```text
STATE_CLONES_REMAINING=3
TABLE_MOBILE_DEFECTS_REMAINING=1
DIRECT_PRIVATE_TABLE_IMPORTS_REMAINING=0
RESIDUALS_ACCEPTED_NON_BLOCKING=yes
```

The remaining items are classified as DEFERRED_NON_BLOCKING or INTENTIONALLY_UNCHANGED and do not invalidate the Wave 4 PASS result.

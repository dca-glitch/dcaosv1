# Final Real-User UI/UX Polish Audit — Current Main Refresh

Status: current-main refresh and bounded implementation pass
Audited commit: `740eedb8c4b630234eb38cf682fdd5826bba996f` (`main`, equal to `origin/main` at start)
Previous audit source: `origin/copilot/final-ui-ux-polish-audit:docs/audits/FINAL_REAL_USER_UI_UX_POLISH_AUDIT.md`
Previous audited commit: `e079eee3a99508852eceb6562c0043ead920f618`
Retrieval method: read-only `git show`; no checkout, merge, cherry-pick, commit, push, deploy, staging, production, or secret access.

## Repository truth at refresh start

- Branch: `main`
- HEAD: `740eedb8c4b630234eb38cf682fdd5826bba996f`
- `main...origin/main`: `0 0`
- Tracked working tree before edits: clean
- Untracked protected files present and not in scope: `.cursor/settings.json`, `_status_report.md`, and the five `docs/audits/FULL_AZ_*` reports named in the task.

## Current implementation decision

The previous audit is directionally useful but partially stale. Current main already includes a DS-backed app modal adapter, matching `aria-describedby` helper/error IDs in form fields, a foundation typography lock, and improved shell accessibility. This pass therefore implements only still-valid, safe, frontend-only polish: readable root type size, safer muted/archive contrast, real sidebar group labels, tokenized overlay chrome in the secondary UI modal/sidesheet, and high-visibility loading-state consolidation. Broad component-system rewrites, workflow redesigns, route hiding, and AI Delivery progressive disclosure are deferred because they require product or larger migration decisions.

## Refreshed finding matrix

| ID | Old severity | Current status before this pass | Final disposition | Affected routes/components | Evidence | Implementation decision | Validation requirement |
|---|---:|---|---|---|---|---|---|
| F-001 | P1 | PARTIALLY VALID | FIXED | Global UI typography | `html` still used `--text-body-sm`; many legacy `rem` sizes exist | Raised document root to `--text-body-md` to prevent compact `rem` text from resolving as microtext while preserving density | web check/build/validate; browser smoke |
| F-002 | P2 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | `styles.css` legacy CSS | Thousands of lines still contain legacy `rem` values | Full token rewrite is broad; root-size fix and future bounded migrations are safer pre-staging | Adversarial search documents residuals |
| F-003 | P2 | PARTIALLY VALID | FIXED FOR HIGH-RISK SYSTEMIC BASE | Labels, captions, table headers | Current root-size change makes compact labels more readable | No mass selector rewrite; root token reduces immediate readability risk | web check/build/browser |
| F-004 | P2 | STILL VALID | FIXED | `--ds-text-muted`, compatibility aliases | Old `#5C6380` was AA-large only and used widely as small text | Raised `--ds-text-muted` to `#7F89A8` | Contrast and smoke review |
| F-005 | P3 | REQUIRES RUNTIME VERIFICATION | DEFERRED WITH ACCEPTED RATIONALE | `--ds-text-faint` | Token remains for decorative/disabled use | No change unless runtime finds readable faint text | Browser/a11y smoke |
| F-006 | P2 | STILL VALID | FIXED | Archived status badge/token | Archived text reused old muted color | Updated archived text/bg/border to match safer muted token | web check/build |
| F-007 | P2 | ALREADY FIXED | VERIFIED ALREADY FIXED | `design-system/components/FormFields.tsx` | Helper/error elements now receive matching IDs for `aria-describedby` | No change needed | typecheck |
| F-008 | P3 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | `FormFields.tsx` | Label-slug IDs still used when no explicit id is provided | Collision risk is lower priority; changing ID generation can disturb selectors | Future component-level change |
| F-009 | P2 | REQUIRES RUNTIME VERIFICATION | DEFERRED WITH ACCEPTED RATIONALE | Primary buttons | White-on-primary requires rendered verification | No blind color shift without rendered verification | Browser smoke |
| F-010 | P1 | PARTIALLY VALID | FIXED FOR APPROVED SCOPE | Modal/component systems | `components/Modal.tsx` is now a DS adapter; other systems remain | Documented canonical path; no broad migration before staging | Modal tests/check/build |
| F-011 | P2 | STILL VALID | FIXED | `components/ui/Modal.tsx`, `SideSheet.tsx` | Inline hex overlay/chrome still present | Replaced overlay, border, and background with DS modal tokens | web check/build |
| F-012 | P2 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | Buttons/action classes | Variant vocabulary remains mixed | Existing compatibility layer already tames neon/translation; full vocabulary migration is broad | Future bounded migration |
| F-013 | P2 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | Badge/status components | Multiple badge wrappers remain | No high-risk status regression found; avoid broad rewrite | Future bounded migration |
| F-014 | P2 | STILL VALID | FIXED FOR HIGH-VISIBILITY SCOPE | Client dashboard, archive, client access | Several inline loading panels still used | Migrated representative/high-traffic inline loading panels to shared `LoadingState` | targeted check/build/browser |
| F-015 | P3 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | Empty states | Shared `EmptyState` is already common; some inline variants remain | No unsafe mass migration | Future route-by-route cleanup |
| F-016 | P2 | STILL VALID | FIXED | Sidebar group labels | `adminSectionLabel` only mapped `protected`; `core`/`client` raw keys could render | Added real labels for admin and portal sections | shell smoke/browser |
| F-017 | P3 | STILL VALID | DEFERRED WITH ACCEPTED RATIONALE | Admin navigation | Long core group remains | Sub-grouping is a product navigation decision | Product decision needed |
| F-018 | P2 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | AI Delivery modal footers | Dense action rows remain in some workflows | Footer redesign risks workflow/smoke selector drift; leave for dedicated AI Delivery UX block | Existing AI Delivery smoke |
| F-019 | P2 | STILL VALID | DEFERRED WITH ACCEPTED RATIONALE | AI Delivery forms | Progressive disclosure would be broad | Requires product/flow decision; no pre-staging rewrite | Dedicated block |
| F-020 | P3 | STILL VALID | DEFERRED WITH ACCEPTED RATIONALE | `AiDeliveryPage.tsx` | Large file remains | Maintainability refactor is out of polish-safe scope | Dedicated refactor block |
| F-021 | P3 | STILL VALID | DEFERRED WITH ACCEPTED RATIONALE | Client portal panels | Client portal remains information-dense | Collapsing panels changes client UX and requires owner decision | Product decision |
| F-022 | P3 | REQUIRES RUNTIME VERIFICATION | DEFERRED WITH ACCEPTED RATIONALE | Placeholder routes | Route/nav visibility must be checked per role | Hiding routes may change product expectations | Browser smoke + owner decision |
| F-023 | P3 | PARTIALLY VALID | DEFERRED WITH ACCEPTED RATIONALE | Design showcase route | Hash route may remain dev/admin utility | Removing/gating route could affect internal review; no production mutation here | Future environment-gating decision |

## New findings introduced after old audit

- N-001: Persistent notification inbox and client-access surfaces are high-traffic and should be included in every browser smoke after UI shell changes. Decision: validate through existing smoke matrix; no business logic changed.
- N-002: `components/ui/Modal.tsx` and `SideSheet.tsx` had retained token drift despite the canonical DS modal adapter being fixed. Decision: tokenized in this pass.

## Canonical component direction

- Modal/dialog: canonical implementation is `apps/web/src/design-system/components/Modal.tsx`; `apps/web/src/components/Modal.tsx` remains the approved compatibility adapter for current app pages.
- Button/input/select/textarea/card/panel/badge/table/loading/empty/error: use existing shared `components/ui`, `design-system`, `LoadingState`, `EmptyState`, and `ErrorState` components according to current imports. Do not introduce a fourth component system.
- Deferred: low-risk legacy wrappers remain where migration would be mechanical but broad.

## Route/state inventory

- Dashboard: shared/structured shell; loading improved where represented by client dashboard.
- AI Delivery: dense but functional; action and progressive disclosure changes deferred to dedicated workflow block.
- Project/brief workflows: mixed inline and shared state patterns remain; high-risk broad rewrite deferred.
- Client portal/archive: loading consolidated in archive and dashboard; errors remain sanitized.
- Notifications: included in required final smoke scope; no source behavior changed.
- Monthly reports/client access/module-disabled/archive/admin management: existing state components remain; client access loading consolidated.

## Deferred items and rationale

Deferred items are accepted only where they would require broad rewrites, product navigation decisions, workflow redesign, or smoke-selector risk before staging. No unresolved P1 remains without a safe bounded mitigation: F-001 is fixed at token root, and F-010 is already substantially addressed by the DS modal adapter with remaining system convergence documented rather than mass-rewritten.

## Validation plan

Run in order: targeted web unit tests where available, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run -w @dca-os-v1/web build`, `npm.cmd run validate`, then only after validate passes run the required local smoke/browser matrix. Stop before smoke if validate fails.

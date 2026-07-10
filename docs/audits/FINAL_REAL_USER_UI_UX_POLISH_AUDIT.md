# Final Real-User UI/UX Polish Audit — DCA OS Lite

> Read-only audit. No application source, schema, or runtime files were modified. This document is the only artifact produced.

---

## 1. Audit Baseline

| Item | Value |
|---|---|
| Repository | `dca-glitch/dcaosv1` |
| Branch | `copilot/final-ui-ux-polish-audit` |
| HEAD commit | `e079eee3a99508852eceb6562c0043ead920f618` ("feat: implement global application shell") |
| Initial git status | Clean (no pre-existing modified or untracked files) |
| Frontend root | `apps/web/src` |
| Audit type | Static, read-only. No rendering, no builds, no servers, no `.env` inspection. |

### Methodology
- Read the token layer (`apps/web/src/design-system/tokens.css`), the global stylesheet (`apps/web/src/styles.css`, 5,651 lines), shell CSS (`apps/web/src/components/shell/shell.css`), and the routing/render tree (`apps/web/src/App.tsx`, 4,776 lines).
- Built a full route inventory from `App.tsx` (`ViewKey` union, `navigationItems`, `clientNavigationItems`, `normalizeHash`) and the client portal router (`pages/client-portal/ClientPortalRouter.tsx`).
- Computed WCAG 2.1 contrast ratios for every explicit hex text/background pair in `tokens.css` using the standard relative-luminance formula (results in §6).
- Traced shared components (`components/ui`, `design-system/components`, legacy `components/Modal.tsx`) to their real import sites via `grep`.
- Reviewed the largest surfaces (`AiDeliveryPage.tsx` 6,025 lines; `ClientPortalPage.tsx` 1,716 lines) for density, hierarchy, terminology, and accessibility.
- Quantified typography by measuring the rem-based `font-size` distribution against the confirmed 13px root.

### Evidence-confidence legend (used verbatim below)
- **CONFIRMED_FROM_CODE** — directly readable in the source at the cited path/line.
- **STRONGLY_INFERRED** — high-confidence conclusion from multiple code signals, but not a single literal line.
- **RUNTIME_VERIFICATION_REQUIRED** — depends on rendered output, gradients, opacity, role state, or data; must be checked in a running browser.
- **OPTIONAL_POLISH** — subjective refinement; not a defect.

No finding in this report is based on visual observation of a rendered screen. No rendering was performed.

---

## 2. Executive Summary

DCA OS Lite has a **mature, well-intentioned foundation**: a single canonical token file (`tokens.css`) with a dark-only palette, semantic status tokens, a shell with real accessibility (focus traps, `aria-modal`, labelled icon buttons), and a client portal with deliberate terminology sanitization. Core flows are present and reachable. There are **no P0 findings** — no essential action is inaccessible.

However, the product is **not yet at "final polish"** because of a small number of **systemic issues** that repeat across many screens:

1. **Typography runs small.** The document root font-size is `13px` (`tokens.css:465`), and the large legacy `styles.css` sizes almost everything in `rem`. As a result **128 of 165 rem-based `font-size` declarations resolve below 11px**, with the smallest at ~8.8px. The 11–24px type-scale tokens defined in `tokens.css` are essentially unused by `styles.css` (`var(--text-caption)` appears **0** times). For an app explicitly built for "long admin sessions" and "highly readable," this is the highest-value fix.
2. **Three overlapping component systems** coexist: `components/ui/*`, `design-system/components/*`, and a legacy `components/Modal.tsx`. Pages import all three (19 legacy-Modal imports, 32 `components/ui` imports, 38 `design-system` imports). Two of the systems' modals/side-sheets hardcode hex colors instead of the modal tokens the third uses.
3. **Feedback-state inconsistency.** ~71% of admin pages render loading state as ad-hoc inline `Spinner + text`; ~29% use the shared `LoadingState`. Empty states are ~18% inline. (Error states are the bright spot — ~86% use the shared `Alert`.)
4. **Contrast on muted text is AA-large only.** `--ds-text-muted` (`#5C6380`) measures 3.07–3.4:1 on the app surfaces — below the 4.5:1 AA-normal threshold — and is used pervasively (53 references in `styles.css`, 42 component files).

The client portal, shell accessibility, status-badge semantics, and error handling are genuinely good and should be preserved. The recommended path is a **structured, ordered polish pass** starting at the token/typography layer.

**Readiness (see §20): NEEDS STRUCTURED POLISH PASS — multiple systemic issues should be addressed.**

---

## 3. Product Surface Inventory

Routing is hash-based (`#/<view>`), resolved by `normalizeHash` (`App.tsx:610`) into a `ViewKey` union (`App.tsx:452–479`). Unknown hashes fall back to `dashboard`. The client portal has a nested sub-router.

### Admin/authenticated routes (rendered in `App.tsx`)
| Hash | ViewKey | Topbar title (`viewTitles.ts`) | Component | Nav section |
|---|---|---|---|---|
| `#/dashboard` | `dashboard` | Dashboard | `DashboardView` (`App.tsx:4481`) | protected |
| `#/modules` | `modules` | Modules | `ModuleRegistryView` (`App.tsx:4498`) | protected |
| `#/tenants` | `tenants` | Tenants | `TenantView` (`App.tsx:4491`) | protected |
| `#/company-profile` | `company-profile` | Company Profile | `CompanyProfilePage` (`4508`) | settings |
| `#/client-portal` | `client-portal` | Client Portal / "Your archive" | `ClientPortalRouter` (`4517`) | client |
| `#/briefs` | `briefs` | Briefs | `BriefPage` (`4520`) | client |
| `#/briefs-panel` | `briefs-panel` | Briefs | `BriefPanelPage` (`4524`) | client |
| `#/workflow-briefs` | `workflow-briefs` | Workflow Briefs | `WorkflowBriefsPage` (`4525`) | core |
| `#/pending-approvals` | `pending-approvals` | Pending Approvals | `PendingApprovalsPage` (`4521`) | client |
| `#/monthly-reports` | `monthly-reports` | Monthly Reports | `MonthlyReportsPage` (`4522`) | client |
| `#/archive` | `archive` | Archive | `ArchiveHubPage` (`4523`) | client |
| `#/clients` | `clients` | Clients | `ClientsPage` / `ClientHubPage` (`4526`) | core |
| `#/projects` | `projects` | Projects | `ProjectsPage` (`4574`) | core |
| `#/ai-delivery` | `ai-delivery` | AI Delivery | `AiDeliveryPage` (`4587`) | core |
| `#/admin-daily-cockpit` | `admin-daily-cockpit` | Daily Cockpit | `AdminDailyOperationsCockpit` (`4675`) | core |
| `#/ai-operations` | `ai-operations` | AI Operations | `AiOperationsPage` (`4678`) | core |
| `#/ai-market-intelligence` | `ai-market-intelligence` | Market Intelligence | `AiMarketIntelligencePage` (`4672`) | core |
| `#/content-plan-review` | `content-plan-review` | Content Plan Review | `ClientContentPlanReviewView` (deferred stub, `4681`) | — |
| `#/content-draft-review` | `content-draft-review` | Content Draft Review | `ClientContentDraftReviewView` (deferred stub, `4682`) | — |
| `#/tasks` | `tasks` | Tasks | `TasksPage` (`4683`) | core |
| `#/invoices` | `invoices` | Invoices | `InvoicesPage` (`4695`) | core |
| `#/credit-notes` | `credit-notes` | Credit Notes | `CreditNotesPage` (`4716`) | core |
| `#/invoice-items` | `invoice-items` | Services Library | `InvoiceItemsPage` (`4728`) | core |
| `#/bills` | `bills` | Bills | `BillsPage` (`4740`) | core |
| `#/settings` | `settings` | Settings | (`4757`) | settings |
| `#/team` | `team` | Team | (`4764`) | settings |
| `#/admin/design-system` | `design-system` | Design System | `DesignShowcase` (`4773`, alias mapped at `615`) | none (not in nav) |

### Client portal sub-routes (`ClientPortalRouter.tsx`, `parseClientPortalHash`)
| Hash | Renders |
|---|---|
| `#/client-portal` | `ClientPortalPage` |
| `#/client-portal/pending-approvals` | `PendingApprovalsPage` |
| `#/client-portal/briefs` | `BriefPage` |
| `#/client-portal/approve/<deliverableId>` | `ArticleApprovalEditor` |

Client-only viewers are constrained to `CLIENT_ALLOWED_ROUTE_VIEWS` (redirect enforced at `App.tsx:1810`) and see `clientNavigationItems` (`App.tsx:546`).

### Expected areas not found / could not be verified
- **`content-plan-review` / `content-draft-review`** exist as routes but render deferred placeholder stubs ("This client review route is deferred for the current MVP." `App.tsx:1731`, `:1741`) — **CONFIRMED_FROM_CODE**.
- **`settings` / `team`** render inline in `App.tsx` (no dedicated page module); their content depth was not fully expanded — **RUNTIME_VERIFICATION_REQUIRED**.
- **Image review/approval** lives inside `ArticleApprovalEditor.tsx` (client) and inside `AiDeliveryPage.tsx` "Article Images" modal (admin, ~lines 5653+) rather than as a standalone route — **CONFIRMED_FROM_CODE**.
- No standalone "project details" route exists; project detail is surfaced via `ClientHubPage`/`ProjectsPage` and AI Delivery workspace — **STRONGLY_INFERRED**.

---

## 4. Top 10 Highest-Value Improvements

1. **F-001 (P1)** Raise effective base type size / stop resolving body text below 11px. Systemic readability win for daily admin users.
2. **F-010 (P1)** Converge the three component systems onto one canonical set; retire the legacy `components/Modal.tsx` path.
3. **F-004 (P2)** Reserve `--ds-text-muted` (`#5C6380`, AA-large only) for large/decorative text; use `--ds-text-secondary` (`#9BA3BF`, 7.2–8.1:1) for any small informational text.
4. **F-002 (P2)** Make `styles.css` consume the `--ds-text-*` type-scale tokens instead of ad-hoc `rem` values.
5. **F-014 (P2)** Standardize loading states on the shared `LoadingState` component (removes ~10 ad-hoc inline variants + the bare `App.tsx:4480` "Loading").
6. **F-011 (P2)** Replace hardcoded hex in `components/ui/Modal.tsx` and `SideSheet.tsx` with the `--ds-modal-*` tokens already used by `design-system/components/Modal.tsx`.
7. **F-007 (P2)** Fix dangling `aria-describedby` references in `design-system/components/FormFields.tsx` (error/helper `<p>` elements lack the referenced ids).
8. **F-018 (P2)** Clarify the primary action in AI Delivery modal footers (5–7 buttons, mostly `ghost-action`, primary not visually dominant).
9. **F-016 (P2)** Give admin sidebar section groups real labels ("Core", "Settings" rather than raw keys); only `protected`→"Product" is currently mapped.
10. **F-003 (P2)** Retire 9px micro-labels (nav section labels, MetricCard label) in favor of the 11px caption token.

---

## 5. Typography and Readability Audit

**Root & scale.** `tokens.css:465` sets the document root `font-size: var(--text-body-sm)` = `13px`. Headings are token-driven (`tokens.css:498–501`: h1=24px, h2=20px, h3=18px, h4=16px) and are healthy. Body and label text, however, is dominated by the legacy `styles.css`, which sizes almost everything in `rem` relative to that 13px root.

**F-001 — Pervasive sub-11px text.** `[P1] · Effort L · CONFIRMED_FROM_CODE`
- Affected users: daily admin, expert speed user, multi-client operator (long sessions); occasional client (portal density).
- Affected screens/routes: global — every screen consuming `styles.css`.
- Evidence: In `styles.css`, `font-size` rem declarations distribute as: `0.68rem`×4, `0.7rem`×5, `0.72rem`×8, `0.75rem`×6, `0.76rem`×7, `0.78rem`×20, `0.8rem`×15, `0.82rem`×45, `0.84rem`×14 … **128 of 165 rem `font-size` declarations are `< 0.85rem`**. At the confirmed 13px root: `0.68rem≈8.8px`, `0.72rem≈9.4px`, `0.78rem≈10.1px`, `0.82rem≈10.7px`. `tokens.css:465` (root=13px).
- Problem: The most common informational text sizes render at ~10.1–10.7px; the smallest at ~8.8px. This is below comfortable reading size for a data-dense internal tool.
- User impact: Eye strain and reduced scannability during long admin sessions; harder for occasional/first-time users to parse dense screens.
- Recommended refinement: Either raise the root to 14px and re-derive, or replace `rem` literals with `--ds-text-*` tokens (min body size 13px `--ds-text-body-sm`; captions 11px `--ds-text-caption`). Do **not** enlarge tables/metrics indiscriminately — keep density (see §7).
- Expected benefit: Materially better readability with controlled, intentional density.
- Scope: `styles.css` type declarations. Dependencies: F-002. Regression risk: layout reflow in tight rows/badges — verify tables and status pills. Acceptance: no user-facing text below 11px except intentional decorative eyebrows; tables still fit.
- Runtime verification: measure computed `font-size` on dashboard metric helpers, table cells, form helper text.

**F-002 — Type-scale tokens unused by legacy CSS.** `[P2] · Effort L · CONFIRMED_FROM_CODE`
- `tokens.css` defines `--ds-text-caption`…`--ds-text-heading-md` (11–24px) and legacy aliases (`--text-caption` etc.), but `styles.css` references `var(--text-caption)` **0** times and uses raw `rem`/`clamp` sizes throughout. The declared type scale and the rendered type scale have diverged.
- Recommended: migrate `styles.css` font sizes to the token scale in the same pass as F-001.

**F-003 — 9px uppercase micro-labels.** `[P2] · Effort S · CONFIRMED_FROM_CODE`
- Evidence: `shell.css:106`, `:134` (nav section label), `:240` all `font-size: 9px`; `components/ui/MetricCard.tsx:39` `text-[9px]` label; `design-system/components/Table.tsx:110` and `Card.tsx:166` `text-[9px]`.
- Problem: 9px uppercase labels are below the 11px caption token and, when combined with muted color (F-004), are low-legibility.
- Recommended: standardize eyebrow/label to `--ds-text-caption` (11px fixed-pixel token, independent of the root size discussed in F-001) with existing letter-spacing; if F-001 changes the token scale, re-derive from the updated caption token rather than a literal 11px.

**Positive:** Headings use a coherent token-driven scale with tuned `letter-spacing` and `line-height` (`tokens.css:498–501`); `line-height: 1.6` base is comfortable.

---

## 6. Contrast and Accessibility Register

WCAG 2.1 ratios computed from explicit hex tokens. Surfaces: page `#06070D`, sidebar `#04050A`, inset `#08090F`, panel `#0C0F1A`, hover `#111525`.

### Text-on-surface (computed)
| Token | Hex | On panel | On page | Verdict |
|---|---|---|---|---|
| `--ds-text-primary` | `#E2E6F2` | 15.32 | 16.13 | **PASS** AA-normal |
| `--ds-text-secondary` | `#9BA3BF` | 7.63 | 8.03 | **PASS** AA-normal |
| `--ds-text-muted` | `#5C6380` | 3.23 | 3.40 | **AA-large only** (fails normal 4.5) |
| `--ds-text-faint` | `#3A4060` | 1.89 | 1.99 | **FAIL** all |

### Status text colors (on panel `#0C0F1A`)
All 13 status text tokens pass AA-normal **except**: `--status-archived-text #5C6380` = 3.23 (AA-large only). Highest-risk accent-as-text: `--ds-accent-primary #6366F1` = 4.28 on panel (fails AA-normal, passes large); `--ds-accent-primary-deep #4F46E5` = 3.04 (large only). Links use `--primary-text` = `--ds-accent-indigo #818CF8` = 6.41 (**PASS**).

**F-004 — Muted text is AA-large only, used for small text.** `[P2] · Effort M · CONFIRMED_FROM_CODE (measurement) / STRONGLY_INFERRED (usage-as-small-text)`
- Evidence: measured 3.07–3.4:1; `--muted`/`--text-muted`/`muted-text` used 53× in `styles.css` and in 42 component files. Combined with F-001, muted text frequently renders at ~10px — well under the 18px "large" threshold that would justify a 3:1 ratio.
- User impact: helper text, timestamps, secondary metadata harder to read; fails AA-normal.
- Recommended: use `--ds-text-secondary` (`#9BA3BF`) for any text < 18px that must be readable; reserve `--ds-text-muted` for ≥18px or decorative. Alternatively lighten `--ds-text-muted` to reach ≥4.5:1.
- Acceptance: all body/helper/label text < 18px measures ≥ 4.5:1.

**F-005 — Faint text fails all thresholds.** `[P3] · Effort XS · RUNTIME_VERIFICATION_REQUIRED`
- `--ds-text-faint #3A4060` = ~1.9:1. Confirm it is used only for non-informational decoration (dividers, disabled placeholders). If used for any readable text, treat as P2.

**F-006 — Archived status & accent-as-text are large-only.** `[P2] · Effort XS · CONFIRMED_FROM_CODE`
- `--status-archived-text #5C6380` (3.23) and any use of `--ds-accent-primary`/`--primary-base` as body text (4.28) fall below AA-normal. Prefer `--ds-accent-indigo` for text roles.

**F-007 — Dangling `aria-describedby` on form fields.** `[P2] · Effort XS · CONFIRMED_FROM_CODE`
- Evidence: `design-system/components/FormFields.tsx:94–101` sets `aria-describedby={`${inputId}-error`}` / `${inputId}-helper`, but `FieldError` (`:23–26`) and `FieldHelper` (`:28–34`) render `<p>` **without** those `id`s.
- User impact: screen readers do not announce validation/helper text associated with the field.
- Recommended: add `id={`${inputId}-error`}` / `id={`${inputId}-helper`}` to the respective `<p>` elements.
- Acceptance: each described-by id resolves to a real node.

**F-008 — Input id derived from label slug → collision risk.** `[P3] · Effort S · CONFIRMED_FROM_CODE`
- `FormFields.tsx:60`: `const inputId = id ?? label?.toLowerCase().replace(/\s+/g,'-')`. Two fields with the same label produce duplicate DOM ids and broken `for`/`id` pairing.
- Recommended: derive a unique id (e.g., `useId()`), keep the label slug only as a fallback prefix.

**F-009 — White-on-primary button contrast is borderline.** `[P2] · Effort XS · RUNTIME_VERIFICATION_REQUIRED`
- White (`#FFFFFF`) on the light end of `--ds-primary-btn-gradient` (`#6366F1`) = 4.47:1, just under AA-normal 4.5. Button text is `text-[11px] font-semibold` (`design-system/components/Button.tsx:87–88`) — 11px is not "large," so 4.47 technically fails AA-normal. On the dark end (`#4F46E5`) = 6.29 (pass).
- Recommended: verify rendered mid-gradient contrast; if needed darken the gradient start or use `#F5F6FF` text. Verify in browser because the gradient midpoint governs.

### Keyboard, semantics, icon-only controls — positive findings (CONFIRMED_FROM_CODE)
- Shell overlays use focus traps and modal semantics: `GlobalSearchOverlay.tsx` (`useFocusTrap`, `role="dialog"`, `aria-modal`, `aria-labelledby`, `tabIndex=-1`, labelled input), `NotificationPanel.tsx` (same pattern), `AppTopbar.tsx:75–104` icon buttons carry `aria-label` ("Open search", "Open notifications") with `aria-hidden` icons.
- Status is never color-only: `StatusBadge` always renders a text label plus a decorative `aria-hidden` dot (`components/ui/StatusBadge.tsx:27–32`).
- Row action menus use native `<details>/<summary>` (keyboard-accessible) across `ClientsPage`, `ProjectsPage`, `TasksPage`, `BillsPage`, `CreditNotesPage`, `InvoiceItemsPage`.
- Filter groups use `role="group"` + `aria-pressed` consistently.

---

## 7. Spacing and Density Review

Density tokens are well-specified and intentionally split admin vs client (`tokens.css`): `--ds-table-row-compact:44px` / `comfortable:52px`; `--ds-table-cell-py-admin:10px` vs `client:14px`; `--ds-card-padding-admin:16px` vs `client:20px 24px`; `--ds-form-input-height-admin:36px` vs `client:44px`; `--ds-admin-page-gutter:28px` vs `client:32px`; `--ds-content-max-client:960px` (client width capped) vs admin `none`.

- **Admin density is appropriate and should be preserved.** Do not add whitespace globally. The dominant density problem is **type size (F-001), not spacing** — small text in otherwise reasonable rows.
- **F-019 (P2) AI Delivery form density** is the main genuine density concern (see §15/§8): Content Plan repeats 7 fields per item; Research Summary stacks 7 `<textarea maxLength={4000}>` fields (`AiDeliveryPage.tsx:~4074–4121`); Deliverables is an 11-field grid (`~5115–5162`). These benefit from progressive disclosure, not from uniform spacing increases.
- **F-021 (P3, OPTIONAL_POLISH) Client portal density**: `ClientPortalPage.tsx` renders ~8–10 panels simultaneously (1,716 lines). Acceptable but on the heavier side for an occasional non-technical client; consider collapsing lower-priority panels by default.

---

## 8. Visual Hierarchy and Action Clarity Review

- **Shared primitives support hierarchy well**: `PageHeader` (eyebrow → h1 → description → meta → filters), `SectionPanel` (title/description/action), `MetricCard`. These give a consistent top-of-page structure across admin screens.
- **F-018 — Primary action not dominant in dense footers.** `[P2] · Effort M · STRONGLY_INFERRED`
  - Evidence: `AiDeliveryPage.tsx` modal footers carry 5–7 buttons (e.g., `~3951–3961`, `~5164–5180`), the majority `ghost-action`, with the single committing `primary-action` (e.g., "Save draft" `~3959`) not visually separated from adjacent ghost buttons.
  - Impact: operators must read every button to find the commit action; slows expert speed users and confuses first-time users.
  - Recommended: enforce one primary per footer, right-aligned, with destructive/secondary/ghost visually subordinate; consider grouping utility actions into an overflow.
- **Button variant vocabulary is fragmented** (see F-012): `primary/secondary/tertiary/destructive` (adapter) vs `primary/secondary/ghost/danger/success/titanium` (design-system) vs raw CSS classes `primary-action/secondary-action/ghost-action` used directly in `AiDeliveryPage`. This weakens a single, learnable "what's the main action" signal.

---

## 9. Navigation and Orientation Review

- Hash routing with a topbar title map (`viewTitles.ts`) and an active-state sidebar (`ShellNav.tsx`, `aria-current="page"`). Icons are provided for every admin view (`ShellNav.tsx ADMIN_ICONS`) and portal view.
- **F-016 — Raw section keys as sidebar group headers.** `[P2] · Effort XS · CONFIRMED_FROM_CODE`
  - Evidence: `sectionLabels.ts` maps only `protected → "Product"` (admin) and `protected→"Overview"`, `client→"Archive"` (portal); every other section returns the raw key. `ShellNav.tsx` renders `sectionLabel(section)` uppercased via `shell.css:132–137` (`text-transform: uppercase`). Admin `navigationItems` include sections `core` and `settings`, which therefore display as literal **"CORE"** and **"SETTINGS"**, and the `client` group as **"CLIENT"**.
  - Impact: inconsistent, developer-flavored group labels in an otherwise polished sidebar.
  - Recommended: map all sections to intentional labels (e.g., `core→"Workspace"`/"Operations", `settings→"Settings"`, `client→"Client"`).
- **F-017 — Long flat "core" group.** `[P3] · Effort S · STRONGLY_INFERRED` The admin `core` section holds ~12 items (`workflow-briefs, clients, projects, ai-delivery, admin-daily-cockpit, ai-operations, ai-market-intelligence, tasks, invoices, credit-notes, invoice-items, bills`). Consider sub-grouping (Delivery/AI vs Finance) to aid orientation.
- **F-022 — Placeholder routes reachable from nav.** `[P3] · Effort S · RUNTIME_VERIFICATION_REQUIRED` `tenants` renders "Not available yet … intentionally paused" (`App.tsx:1359`) and `modules` has a placeholder panel (`:1337`). Recommended: hide these nav entries for roles that cannot use them (or mark them "Coming soon" with a disabled style) instead of routing to dead-end panels; verify at runtime which roles currently see them.
- **F-023 — Design showcase ships in-app.** `[P3] · Effort XS · CONFIRMED_FROM_CODE` `#/admin/design-system` → `DesignShowcase` (`App.tsx:615, 4773`) is reachable by hash though absent from nav. Recommended: gate the route to admin roles and exclude it from production builds (or remove the route registration); keep it available in dev only.

**Positive:** Client vs admin shells are distinct (`shellVariant` at `App.tsx:4463`), and client-only viewers are redirected out of admin routes (`App.tsx:1810`).

---

## 10. Component Consistency Register

**F-010 — Three overlapping UI component systems.** `[P1] · Effort L · CONFIRMED_FROM_CODE`
- Systems: (1) `components/ui/*` (Button, Badge, StatusBadge, Modal, Table, PageHeader, SectionPanel, MetricCard, SideSheet, ModalActions); (2) `design-system/components/*` (Alert, Badge, Button, Card, FormFields, Layout, Modal, Spinner, Table, Tabs); (3) legacy standalone `components/Modal.tsx` + `components/{LoadingState,EmptyState,ErrorState,StatusNotice,DashboardCard}.tsx`.
- Usage (grep): ~32 imports of `components/ui`, ~38 of `design-system`, **19 pages import the legacy `components/Modal`** (e.g., `ClientsPage.tsx:4`, `ProjectsPage.tsx:3`, `TasksPage.tsx:2`, `InvoicesPage.tsx:3`, `BillsPage.tsx:3`, `AiDeliveryPage.tsx:3`, `CompanyProfilePage.tsx:5`, `AiOperationsPage.tsx:11`).
- `components/ui/*` are partly adapters over `design-system` (Button → DS Button; Table → DS Table; StatusBadge → DS status), so three "modal" implementations and two "Button/Badge/Table" surfaces are all live.
- Impact: divergent props, styling, and behavior; higher regression surface; harder to apply a single polish change.
- Recommended: pick `design-system/components` as canonical, keep `components/ui` only as thin adapters (or delete), and retire `components/Modal.tsx` by migrating its 19 call sites. This is the second-highest-value structural fix after typography.

**F-011 — Hardcoded hex in ui Modal/SideSheet (token drift).** `[P2] · Effort S · CONFIRMED_FROM_CODE`
- `components/ui/Modal.tsx` and `components/ui/SideSheet.tsx` inline `background: rgba(3,3,8,0.72)`, `border: 1px solid rgba(255,255,255,0.13)`, and `linear-gradient(150deg,#09090F 0%,#0E0B1C 100%)` — an exact copy-paste pair. `design-system/components/Modal.tsx` uses the token equivalents `--ds-modal-backdrop`, `--ds-modal-border`, `--ds-modal-gradient`. Same visual, two sources of truth.
- Recommended: replace the hex literals with `--ds-modal-*` tokens.

**F-012 — Button variant drift.** `[P2] · Effort S · CONFIRMED_FROM_CODE`
- `components/ui/Button.tsx:6` exposes `primary|secondary|tertiary|destructive` and maps `tertiary→ghost`, `destructive→danger` (`:15–20`); `design-system/components/Button.tsx:3` exposes `primary|secondary|ghost|danger|success|titanium`. `success`/`titanium` are unreachable through the adapter. Meanwhile `AiDeliveryPage` uses raw CSS classes `primary-action/secondary-action/ghost-action` directly.
- Recommended: one variant vocabulary; make the adapter pass-through or standardize on DS names.

**F-013 — Badge/status duplication.** `[P2] · Effort S · CONFIRMED_FROM_CODE`
- `components/ui/StatusBadge.tsx` (token/status-driven), `components/ui/Badge.tsx` (`badge-<variant>` CSS classes), and `design-system/components/Badge.tsx` are three badge surfaces. Consolidate to reduce drift.

**Intentional (not drift):** `components/ui/StatusBadge` re-exporting `design-system/status` helpers is a deliberate, healthy adapter; `components/{LoadingState,ErrorState,StatusNotice}` wrapping DS `Alert`/`Spinner` is reasonable composition.

---

## 11. Forms and Controls Review

- Two label patterns coexist: DS `Input/Select/Textarea` with a `label` prop that **does** associate via `htmlFor`/`id` (`FormFields.tsx:60,66,74`), and native `<label>`-wrapping (e.g., `CompanyProfilePage.tsx:292–437`, `ModuleFormPage.tsx:13–20`). Both are valid; consistency is the only issue.
- **F-007** (dangling `aria-describedby`) and **F-008** (label-slug id collisions) are the concrete form accessibility defects — see §6.
- Inputs have a defined focus ring: `styles.css:132–137` applies `box-shadow: var(--ds-shadow-focus)` and border color change on `:focus`. Global `input/select/textarea` min-height 44px in `styles.css:118` (comfortable), though DS admin input height token is 36px — verify which applies where (**RUNTIME_VERIFICATION_REQUIRED**).
- Placeholder color `rgba(216,208,238,0.62)` (`styles.css:139`) — verify contrast for placeholder-as-hint cases (should not be the only label).

---

## 12. Tables and Information-Density Review

- Table rendering is mixed: `components/ui/Table` (most list pages — Projects, Tasks, Bills, Credit Notes, Brief Panel), `design-system` `TableHead/TableBody` (`InvoicesPage`), raw `<table>` (`ModuleListPage.tsx:17–33` placeholder), and card/`dense-list` layouts (`ClientsPage`, `InvoiceItemsPage`).
- **Preserve tables where comparison matters** (invoices, tasks, projects) — do not convert to cards. The density tokens (§7) are appropriate.
- The main table issue is **F-001 type size** inside cells (~10px), not row height. Consolidating table implementations (part of F-010) would also unify sort/empty/hover behavior.
- No color-only status in tables — `StatusBadge` carries text (CONFIRMED, §6).

---

## 13. Feedback and Interaction States Review

**F-014 — Loading-state inconsistency.** `[P2] · Effort M · CONFIRMED_FROM_CODE`
- ~10 admin pages render ad-hoc inline `role="status"` + `Spinner` + text (e.g., `ClientsPage.tsx:189`, `ProjectsPage.tsx:153`, `TasksPage.tsx:172`, `InvoicesPage.tsx:644`, `BillsPage.tsx:261`, `CreditNotesPage.tsx:348`, `InvoiceItemsPage.tsx:102`, `ArchiveHubPage.tsx:437`), while `WorkflowBriefsPage`, `ClientHubPage:263`, `BriefPanelPage:546`, `CompanyProfilePage:145` use the shared `LoadingState`. The global app loader is a bare `<div className="state-panel">Loading</div>` (`App.tsx:4480`).
- Recommended: route all through `LoadingState`.

**F-015 — Empty-state inconsistency.** `[P3] · Effort S · CONFIRMED_FROM_CODE`
- ~18% of empties are inline `<p className="inline-empty">` (`CreditNotesPage.tsx:565`, `BillsPage.tsx:391`, `InvoicesPage.tsx:1142,1235`, `TasksPage.tsx:224`) vs the shared `EmptyState` used elsewhere. `BillsPage`/`CreditNotesPage` mix both.

**Positive — error states are consistent.** ~86% of pages use the shared `Alert` (via `ErrorState`/`StatusNotice`), with titled, human-readable messages ("Clients unavailable," "Bills unavailable," etc.). Keep this pattern; extend it to loading/empty.

---

## 14. Dark-Theme and Visual-Finish Review

- The palette is **professional, not gaming-oriented**: near-black surfaces (`#04050A`–`#0C0F1A`), restrained indigo/mauve accents (`#6366F1`, `#A07AC8`), subtle multi-stop page gradient (`--ds-page-gradient`), controlled borders (`rgba(255,255,255,0.06–0.11)`), and layered shadows (`--ds-shadow-flat/raised/overlay/modal`). This matches the intended "black with restrained navy/deep-purple, subtly premium" direction.
- Grid/glow overlays are explicitly neutralized (`styles.css:26–29`; `tokens.css` `body::before/::after { content:none !important }`), confirming a deliberate move away from decorative noise. Good.
- **Separate readability from beautification:** the finish is largely there; the outstanding issues are **readability** (F-001, F-004, F-003), not aesthetics. Beautification items (accent tints on MetricCard — note `accent` prop is currently a no-op at `MetricCard.tsx:23`) are **OPTIONAL_POLISH**.
- `backdrop-filter: blur(...)` is used on sidebar/panels/login (`styles.css`); verify performance and legibility over the gradient (**RUNTIME_VERIFICATION_REQUIRED**).

---

## 15. Screen-by-Screen Findings

For each area the seven orientation questions (where am I / purpose / status / what needs attention / primary action / secondary actions / read-only / what's next) were considered from five personas (daily admin, multi-client operator, occasional client, first-time user, expert speed user).

- **Application shell (AppLayout/AdminSidebar/PortalSidebar/AppTopbar).** Strong. Clear location (active nav + topbar title), accessible overlays, distinct admin/portal variants. Gaps: F-016 raw section labels; F-003 9px nav labels. Personas: first-time users mildly hurt by "CORE/SETTINGS" headers.
- **Admin dashboard (`DashboardView`, `App.tsx:4481`).** Provides quick links ("Review active tasks," "Check project delivery," `App.tsx:1195–1212`). "What needs attention" relies on activity audit logs; verify prominence (**RUNTIME_VERIFICATION_REQUIRED**). Type size (F-001) affects scannability.
- **Client dashboard (`ClientDashboardPage.tsx`).** Uses friendly brief-status labels (`getBriefStatusBadge`). Simpler than admin — appropriate.
- **Clients (`ClientsPage`/`ClientHubPage`).** `dense-list` cards, filter buttons with `aria-pressed`, `<details>` row menus, `EmptyState` present; loading is inline (F-014).
- **Projects (`ProjectsPage`).** `Table` with Project/Client/Status/Tasks/Due/Action columns; `EmptyState`; inline loading (F-014). Good comparison layout — keep table.
- **Project details.** No dedicated route (surfaced via hub/AI Delivery) — orientation "what's next" is implicit; **STRONGLY_INFERRED** minor gap.
- **Briefs (`BriefPage`, `BriefPanelPage`, `WorkflowBriefsPage`).** Role-aware status labels ("Awaiting your input" vs "Sent to Client"); `WorkflowBriefsPage` uses shared `LoadingState`/`ErrorState`/`EmptyState` — a good template.
- **AI Delivery (`AiDeliveryPage.tsx`, 6,025 lines).** Rich operator surface: header + operator summary (MetricCards) + project picker + workspace + 9 modal workflows (project, brief, content plan, research/sources, market-intel, workflow runs, content drafts, deliverables, article images). Strengths: shared components, `StatusBadge` everywhere, consistent inline loading/alert/empty helpers, proper `<label>` wrapping, no icon-only buttons, no raw provider/model names in UI, "monthly content plan" terminology honored (`:3850,:3969`), "package" used as internal/platform-neutral label. Weaknesses: **F-018** action clarity in 5–7-button footers; **F-019** form density (7-field repeating items; 7 stacked textareas `~4074–4121`; 11-field grid `~5115–5162`); **F-020 (P3, OPTIONAL)** 6,025-line single file (maintainability risk, not user-facing).
- **AI Operations / Daily Cockpit / Market Intelligence.** Use `Alert` for errors; `AdminDailyOperationsCockpit.tsx:277` and `AiOperationsPage.tsx:138` use inline loading text (F-014).
- **Content planning / production.** Handled within AI Delivery modals (above). Standalone review routes are deferred stubs (`content-plan-review`, `content-draft-review`).
- **Article editor/review (`ArticleApprovalEditor.tsx`, client).** Task-focused, ~698 lines, exposes only business fields (title, summary, category, tags, publish date, body, image alt text) — no workflow/run/provider internals. Auto-save reduces button clutter. Good client fit.
- **Image review/approval.** Client: image cards with Approved/Rejected/Pending + rejection reason (`ArticleApprovalEditor`). Admin: "Article Images" modal in AI Delivery. Friendly labels, no color-only status.
- **Monthly report administration (`MonthlyReportsPage`, `MonthlyReportPanel`).** Present; verify admin vs client visibility of internal metrics (**RUNTIME_VERIFICATION_REQUIRED**).
- **Client monthly reports.** Surfaced in `ClientPortalPage` reports panel with friendly copy.
- **Client portal (`ClientPortalPage.tsx`, 1,716 lines).** See §16; strong sanitization, friendly empty/loading/error copy. F-021 density (OPTIONAL).
- **Forms / dialogs.** Modal usage consistent per page but split across three modal implementations (F-010/F-011). Form label defects F-007/F-008.
- **Tables.** Mixed implementations (§12).
- **Empty states / errors.** Errors consistent (Alert); empties/loaders inconsistent (F-014/F-015).
- **Settings / Team / Company Profile.** `CompanyProfilePage` uses shared `LoadingState`/`ErrorState`/`EmptyState` and native labels — a good reference. `settings`/`team` render inline in `App.tsx`; depth **RUNTIME_VERIFICATION_REQUIRED**.

**Expected areas not found:** standalone project-details route; standalone content plan/draft review (deferred stubs); standalone image-review route (embedded).

---

## 16. Admin versus Client Findings

- **Separation is real and correct.** Distinct shells (`shellVariant`), distinct nav sets (`navigationItems` vs `clientNavigationItems`), client width cap (`--ds-content-max-client:960px`) and larger client density tokens (cell padding 14px, input height 44px, card padding 20/24px) vs admin (10px/36px/16px).
- **No terminology leakage to clients — CONFIRMED strength.** `client-portal-api.ts:19–31` actively strips internal terms from client-facing errors (`workflowRunId`, `workflowRunStatus`, `providerMetadata`, `provider:`, `actualCostUsd`, `estimatedCostUsd`, `storageKey`, `stack:`). Client status strings are mapped to friendly labels via `toClientPortalStatusLabel` (`ClientPortalPage.tsx:355–407`), which returns `null` for unknown enums rather than leaking raw workflow tokens (`:405`). `lib/proof-state-labels.ts` (admin readiness vocabulary) is **not** imported anywhere in the client portal.
- **Client density is the only client-side concern** (F-021, OPTIONAL): ~8–10 simultaneous panels is heavier than ideal for an occasional non-technical user.
- **Admin efficiency preserved:** the fixes recommended (typography, contrast, state consistency) do not reduce admin density.

---

## 17. Runtime Verification Checklist

1. **F-001/F-002:** Measure computed `font-size` on: dashboard metric helper text, a data table cell, form helper text, status badge, nav section label. Confirm none render < 11px unintentionally.
2. **F-004/F-006:** Sample rendered muted/archived/accent text against actual (gradient) backgrounds with a contrast tool; confirm ≥4.5:1 for < 18px text after fixes.
3. **F-009:** Measure white button-label contrast at the gradient midpoint of `--ds-primary-btn-gradient`.
4. **F-005:** Confirm `--ds-text-faint` is used only decoratively.
5. **F-007:** With a screen reader, confirm field error/helper text is announced after adding ids.
6. **F-011/F-010:** Visually diff the three modal implementations for identical chrome; confirm no regression after token/consolidation.
7. **F-018:** Verify one visually dominant primary per AI Delivery modal footer.
8. **F-022/F-023:** Verify role visibility of `tenants`/`modules` placeholders and `#/admin/design-system` in production builds.
9. **Forms:** Confirm which input-height token applies (global 44px vs admin 36px) and that focus rings are visible on all controls.
10. **backdrop-filter:** Confirm legibility/perf of blurred panels over the page gradient on low-end hardware.
11. **Keyboard:** Tab through AI Delivery modals and row `<details>` menus; confirm focus order and Escape-to-close.

---

## 18. Ordered Implementation Backlog

### A. Design tokens and typography
- **F-001 (P1, L)** Raise effective body size / migrate `styles.css` off sub-11px `rem`. Files: `styles.css`, `tokens.css`. Deps: F-002. Acceptance: no readable text < 11px. Risk: reflow — verify tables/badges. Verify: computed sizes.
- **F-002 (P2, L)** Consume `--ds-text-*` tokens in `styles.css`. Files: `styles.css`. Acceptance: 0 raw `rem` `font-size` literals for body/label. Risk: mapping errors. Verify: visual + computed.
- **F-003 (P2, S)** Retire 9px labels → 11px caption. Files: `shell.css`, `components/ui/MetricCard.tsx`, DS `Table.tsx`/`Card.tsx`. Acceptance: min label 11px. Risk: minor width change.
- **F-004 (P2, M)** Reassign muted→secondary for small text; or lighten `--ds-text-muted`. Files: `tokens.css`, `styles.css`. Acceptance: ≥4.5:1 for < 18px. Risk: perceived heavier UI.
- **F-006 (P2, XS)** Use `--ds-accent-indigo` for accent-as-text; review archived badge. Files: `tokens.css`/consumers.

### B. Shared components
- **F-010 (P1, L)** Converge to one system; retire `components/Modal.tsx` (19 call sites). Files: `components/ui/*`, `design-system/components/*`, 19 pages. Acceptance: one Modal path; adapters thin. Risk: broad regression — do behind a mechanical, test-covered migration. Verify: modal open/close/focus on each page.
- **F-011 (P2, S)** Tokenize `components/ui/Modal.tsx` + `SideSheet.tsx`. Acceptance: no hex literals. Risk: none visual.
- **F-012 (P2, S)** Unify Button variant vocabulary. Files: `components/ui/Button.tsx`, call sites. Acceptance: single variant set.
- **F-013 (P2, S)** Consolidate Badge/StatusBadge. Files: `components/ui/Badge.tsx`, DS `Badge.tsx`.

### C. Navigation and shell
- **F-016 (P2, XS)** Real section labels. Files: `components/shell/sectionLabels.ts`. Acceptance: no raw keys shown.
- **F-017 (P3, S)** Sub-group long "core" nav. Files: `App.tsx` `navigationItems`, `ShellNav.tsx`.
- **F-022 (P3, S)** Hide/clarify placeholder routes. Files: `App.tsx`, `navigation-filter.ts`.
- **F-023 (P3, XS)** Gate/exclude design showcase from production. Files: `App.tsx`.

### D. Admin screens
- **F-014 (P2, M)** Standardize loading → `LoadingState`. Files: ~10 pages + `App.tsx:4480`. Acceptance: no inline loaders. Risk: none.
- **F-015 (P3, S)** Standardize empties → `EmptyState`. Files: Credit Notes/Bills/Invoices/Tasks.
- **F-018 (P2, M)** One dominant primary per AI Delivery footer. Files: `AiDeliveryPage.tsx`.
- **F-019 (P2, M–L)** Progressive disclosure for dense AI Delivery forms. Files: `AiDeliveryPage.tsx`, subcomponents.
- **F-020 (P3, L, OPTIONAL)** Split `AiDeliveryPage.tsx` for maintainability.

### E. Client screens
- **F-021 (P3, M, OPTIONAL)** Collapse lower-priority `ClientPortalPage` panels by default. Files: `ClientPortalPage.tsx`.

### F. Accessibility
- **F-007 (P2, XS)** Add ids to error/helper `<p>`. Files: `design-system/components/FormFields.tsx`. Acceptance: describedby resolves.
- **F-008 (P3, S)** Unique input ids (`useId`). Files: `FormFields.tsx`.
- **F-009 (P2, XS)** Fix white-on-primary contrast. Files: `tokens.css`/`Button.tsx`.

### G. Runtime verification
- Execute §17 checklist after A–F.

### H. Optional beautification
- MetricCard `accent` tint activation (`MetricCard.tsx:23` no-op); subtle hover/press motion polish. All OPTIONAL_POLISH.

---

## 19. Recommended Polish-Pass Sequence

1. **Tokens** — typography scale + muted/accent contrast (F-001, F-002, F-004, F-006, F-009).
2. **Primitives** — Button/Badge/Modal tokenization and variant unification; FormFields a11y (F-011, F-012, F-013, F-007, F-008).
3. **Shared components** — converge systems, retire legacy Modal (F-010).
4. **Shell and navigation** — section labels, nav grouping, placeholders, showcase gating (F-016, F-017, F-022, F-023, F-003).
5. **Admin screens** — loading/empty standardization, AI Delivery action clarity & density (F-014, F-015, F-018, F-019).
6. **Client screens** — optional density reduction (F-021).
7. **Accessibility verification** — §17 checklist, screen-reader + keyboard passes.
8. **Optional visual refinement** — MetricCard tint, motion polish.

---

## 20. Final Recommendation

Evidence summary: **no P0** findings; **2 P1** (F-001 systemic sub-11px typography across `styles.css`; F-010 three overlapping component systems with 19 legacy-Modal call sites); a cluster of **P2** consistency/contrast/accessibility issues (muted text AA-large only at 3.2:1 used 53×; loading-state inconsistency ~71% inline; hardcoded modal hex bypassing `--ds-modal-*`; dangling `aria-describedby`; raw sidebar section keys; AI Delivery action clarity/density). Offsetting strengths are real and should be preserved: token-driven dark theme, accessible shell overlays, text-labelled status badges, consistent error handling, and a client portal that actively sanitizes internal terminology.

These issues are **systemic but bounded and mechanical** — concentrated at the token/typography layer and the component-system layer — rather than broken flows.

**NEEDS STRUCTURED POLISH PASS — multiple systemic issues should be addressed.**

---

### Findings index
| ID | Title | Sev | Effort | Confidence |
|---|---|---|---|---|
| F-001 | Pervasive sub-11px text (13px root + rem) | P1 | L | CONFIRMED_FROM_CODE |
| F-002 | Type-scale tokens unused by styles.css | P2 | L | CONFIRMED_FROM_CODE |
| F-003 | 9px uppercase micro-labels | P2 | S | CONFIRMED_FROM_CODE |
| F-004 | Muted text AA-large only, used small | P2 | M | CONFIRMED_FROM_CODE / STRONGLY_INFERRED |
| F-005 | Faint text fails all thresholds | P3 | XS | RUNTIME_VERIFICATION_REQUIRED |
| F-006 | Archived/accent text large-only | P2 | XS | CONFIRMED_FROM_CODE |
| F-007 | Dangling aria-describedby on form fields | P2 | XS | CONFIRMED_FROM_CODE |
| F-008 | Input id from label slug → collisions | P3 | S | CONFIRMED_FROM_CODE |
| F-009 | White-on-primary button borderline | P2 | XS | RUNTIME_VERIFICATION_REQUIRED |
| F-010 | Three overlapping component systems | P1 | L | CONFIRMED_FROM_CODE |
| F-011 | Hardcoded hex in ui Modal/SideSheet | P2 | S | CONFIRMED_FROM_CODE |
| F-012 | Button variant drift | P2 | S | CONFIRMED_FROM_CODE |
| F-013 | Badge/status duplication | P2 | S | CONFIRMED_FROM_CODE |
| F-014 | Loading-state inconsistency | P2 | M | CONFIRMED_FROM_CODE |
| F-015 | Empty-state inconsistency | P3 | S | CONFIRMED_FROM_CODE |
| F-016 | Raw section keys as nav headers | P2 | XS | CONFIRMED_FROM_CODE |
| F-017 | Long flat "core" nav group | P3 | S | STRONGLY_INFERRED |
| F-018 | AI Delivery primary action not dominant | P2 | M | STRONGLY_INFERRED |
| F-019 | AI Delivery form density | P2 | M–L | CONFIRMED_FROM_CODE |
| F-020 | 6,025-line AiDeliveryPage (maintainability) | P3 | L | CONFIRMED_FROM_CODE (OPTIONAL_POLISH) |
| F-021 | ClientPortalPage panel density | P3 | M | STRONGLY_INFERRED (OPTIONAL_POLISH) |
| F-022 | Placeholder routes reachable in nav | P3 | S | RUNTIME_VERIFICATION_REQUIRED |
| F-023 | Design showcase ships in-app | P3 | XS | CONFIRMED_FROM_CODE |

**Totals: 23 findings — P0: 0 · P1: 2 · P2: 13 · P3: 8. RUNTIME_VERIFICATION_REQUIRED items: 3 (F-005, F-009, F-022).**

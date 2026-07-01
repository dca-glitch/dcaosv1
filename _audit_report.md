# DCA OS Lite Frontend Read-Only Audit

Date/time: 2026-06-30 SGT  
Mode: read-only audit. No fixes, commits, package installs, service startup, backend/API/auth/schema/VPS/deploy work.

## Executive conclusion

The reported Add Invoice regression is real by code trace. `InvoicesPage` uses the legacy adapter at `apps/web/src/components/Modal.tsx`, but that adapter delegates to `apps/web/src/design-system/components/Modal.tsx`, whose overlay positioning is entirely Tailwind utility-driven: `fixed inset-0 z-modal flex items-center justify-center p-4`. If Tailwind utilities are absent, stale, not loaded, or generated from the wrong config, the modal backdrop becomes a normal-flow `<div>`, which exactly matches the inline form symptom.

This is not Invoice-specific. Every page using the same adapter is exposed to the same failure mode.

Strategic recommendation: pause the design-system migration for launch-critical work and do not continue the current incremental block-by-block layering in its present form. Before continuing, consolidate onto one explicit styling contract, retire misleading duplicate config, and ensure launch-critical primitives such as Modal do not lose positioning when Tailwind utility output is missing or miscompiled.

## Repository state verified

- Current branch: `feature/blok-6-comprehensive-test-suite`.
- Pre-existing uncommitted state observed:
  - `M .cursor/rules/design-system-migration.mdc`
  - `?? _status_report.md`
- `git diff --stat` during audit showed only `.cursor/rules/design-system-migration.mdc | 7 +++++++`; this audit did not create that change.
- Relevant commits observed:
  - `4981376 fix: remove duplicate manual badge CSS now that Tailwind compiles`
  - `3f3dfc3 build: install and wire up Tailwind CSS v3`
  - `f7a8375 fix: spinner and modal close icon oversized without Tailwind utilities`
  - `3654edc fix: badge class collision with legacy CSS`
  - `08e4557 wip: claude code migration progress before switching to cursor`

The prompt's branch and recent Tailwind-wiring framing were correct. One important nuance: `InvoicesPage` does not import the design-system Modal directly; it imports the adapter wrapper, and the adapter imports the design-system Modal internally.

## P0: Add Invoice modal regression trace

### InvoicesPage modal import

`apps/web/src/pages/invoices/InvoicesPage.tsx` imports:

```tsx
import { Modal } from "../../components/Modal";
```

So InvoicesPage uses `apps/web/src/components/Modal.tsx`, not `apps/web/src/design-system/components/Modal.tsx` directly.

The Add Invoice render path wraps the invoice form in `<Modal ...>` with title `Add Invoice` when `isInvoiceEditorOpen` is true.

### Adapter behavior

`apps/web/src/components/Modal.tsx` is a prop adapter only:

```tsx
import DSModal from "../design-system/components/Modal";

export function Modal({ title, onClose, children, footer, size = "md", eyebrow }: ModalProps) {
  return (
    <DSModal
      isOpen={true}
      onClose={onClose}
      title={title}
      subtitle={eyebrow}
      footer={footer}
      size={sizeMap[size]}
    >
      {children}
    </DSModal>
  );
}
```

It no longer renders the old `.modal-backdrop`, `.modal-panel`, `.modal-header`, or `.modal-body` structure. Therefore legacy modal CSS still present in `styles.css` and `styles/globals.css` does not protect this adapter path.

### Design-system Modal positioning dependency

`apps/web/src/design-system/components/Modal.tsx` renders the overlay as:

```tsx
<div
  className="fixed inset-0 z-modal flex items-center justify-center p-4"
  style={{ background: 'rgba(2,3,6,0.80)' }}
>
```

The panel also depends on Tailwind utilities such as `relative`, `w-full`, `flex`, `flex-col`, `border-border-strong`, `rounded-lg`, `max-h-[90vh]`, and `max-w-5xl`.

If utilities like `fixed`, `inset-0`, `flex`, `items-center`, `justify-center`, `p-4`, or `z-modal` are missing, the modal is normal-flow markup. That explains the Add Invoice form rendering inline.

### Large malformed icon shapes

Commit `f7a8375` changed the Modal close icon from:

```tsx
<svg className="w-4 h-4" ...>
```

to:

```tsx
<svg width={16} height={16} className="w-4 h-4" ...>
```

and added explicit SVG dimensions to Spinner. The commit message is `fix: spinner and modal close icon oversized without Tailwind utilities`, which proves this repository already hit the same category of bug: design-system components assumed Tailwind utility sizing was active, and when it was not, SVGs became oversized/malformed.

### Tailwind wiring commit

Commit `3f3dfc3`:

- added `tailwindcss`, `postcss`, and `autoprefixer` to `apps/web/package.json`;
- added `apps/web/postcss.config.js`;
- inserted `@tailwind base; @tailwind components; @tailwind utilities;` into `apps/web/src/styles.css`;
- added `corePlugins: { preflight: false }` to `apps/web/tailwind.config.ts`.

Current `apps/web/src/main.tsx` imports CSS in this order:

```tsx
import "./styles/globals.css";
import "./styles.css";
```

So `styles/globals.css` loads first, then `styles.css` imports tokens, Tailwind layers, and thousands of legacy/Dark Nebula global rules. This makes cascade outcomes hard to reason about.

### Is this specific to Invoices?

No. `apps/web/src/pages/clients/ClientsPage.tsx` also imports `Modal` from `../../components/Modal` and renders Add/Edit Client through the same adapter. Other pages using the adapter include Tasks, Projects, Bills, Credit Notes, Invoice Items, AI Delivery, AI Operations, and Article Approval Editor paths. Any of these can hit the same inline-modal failure if Tailwind positioning utilities are not available.

## Styling systems currently coexisting

At least five styling patterns coexist:

1. **Legacy global classes in `apps/web/src/styles.css`** — `.app-shell`, `.sidebar`, `.view-section`, `.entity-form`, `.field-grid`, `.modal-backdrop`, `.modal-panel`, `.primary-action`, `.secondary-action`, `.table-wrap`, `.entity-card`, and many more.
2. **Additional global bridge in `apps/web/src/styles/globals.css`** — tokens, global resets, `.btn-*`, `.badge-*`, `.dense-table`, `.modal-*`, `.side-sheet-*`, `.ds-page-header`, action/status bridges, shell overrides.
3. **Tailwind utilities generated from `apps/web/tailwind.config.ts`** — heavily used inside `apps/web/src/design-system/components/*` and some shared wrappers.
4. **Design-system token CSS in `apps/web/src/design-system/tokens.css`** — imported by `styles.css`; defines `--surface-*`, `--text-*`, `--z-modal`, etc.
5. **Inline styles and ad hoc class/style hybrids** — present across several pages, especially Brief/AI Delivery/client portal areas.

Which system wins is governed by import order, Tailwind layer order, selector specificity, and whether a class is actually generated. Because Tailwind is injected near the top of `styles.css` and then followed by thousands of global rules, later legacy/Dark Nebula rules can override matching properties. When a Tailwind utility is missing, the markup silently degrades.

## Tailwind config duplication

Two Tailwind config files exist:

- `apps/web/tailwind.config.ts`
- `apps/web/src/design-system/tailwind.config.ts`

The active compiled config is `apps/web/tailwind.config.ts`, because Vite root is `apps/web`, `apps/web/postcss.config.js` invokes `tailwindcss: {}`, and Tailwind resolves config from the app root. The nested `apps/web/src/design-system/tailwind.config.ts` is not the active build config.

The nested config is stale/misleading/dangerous because it is nearly a duplicate but lacks `corePlugins: { preflight: false }`, so it materially disagrees with the active config. Someone could edit the nested file and assume it affects the app when it does not.

## Adapter-wrapper consistency

The adapter pattern exists but is not followed consistently.

Adapters/wrappers found:

- `apps/web/src/components/Modal.tsx` wraps design-system Modal.
- `apps/web/src/components/ui/Button.tsx` wraps design-system Button.
- `apps/web/src/components/ui/StatusBadge.tsx` wraps design-system Badge.
- `apps/web/src/components/ui/Table.tsx` wraps design-system Table primitives.
- `apps/web/src/components/ui/ModalActions.tsx` provides legacy modal action layout.

However, many migrated pages import primitives directly from `../../design-system` or `../design-system`, bypassing adapters for Alert/Input/Select/Spinner/Textarea/Card/Toast/Table primitives. Examples include `InvoicesPage.tsx`, `ClientsPage.tsx`, `TasksPage.tsx`, `ProjectsPage.tsx`, `BillsPage.tsx`, `CreditNotesPage.tsx`, `InvoiceItemsPage.tsx`, `ClientPortalPage.tsx`, and `ArticleApprovalEditor.tsx`.

This is mixed-mode migration drift: some primitives are compatibility-adapted, others are direct design-system usage. That increases the blast radius of Tailwind/config/token changes.

## Cursor rule file assessment

`.cursor/rules/design-system-migration.mdc` is in the conventional Cursor rules location and has `.mdc` frontmatter:

```yaml
---
description: Constraints for the DCA OS Lite design system migration
globs: apps/web/src/**/*.tsx
alwaysApply: true
---
```

This is plausibly loadable by Cursor, but the repository alone cannot prove Cursor actually loaded/enforced it in prior sessions. The current file is also modified relative to HEAD. Its `globs` only match `apps/web/src/**/*.tsx`; if Cursor applies globs narrowly, the rule does not naturally attach to `apps/web/package.json`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`, or CSS files even though the prose discusses those areas.

## Additional fragile/accidental risks

1. Old modal CSS remains but no longer protects adapter modals, because the adapter now renders design-system Modal markup instead of `.modal-backdrop`/`.modal-panel` markup.
2. Design-system Modal has no defensive inline positioning. Background is inline, but all overlay positioning/centering is Tailwind-only.
3. Tailwind preflight is disabled, so design-system components coexist with legacy global element rules for inputs, buttons, tables, headings, paragraphs, etc.
4. Global class collisions are already proven by commits around badge collisions and duplicate manual badge CSS.
5. `tokens.css` says to import in `src/index.css`, but the actual entry is `src/styles.css`; this is stale documentation inside the codebase.
6. Direct design-system imports were found in many TSX files, increasing blast radius.
7. The code has already required explicit SVG fallback dimensions because Tailwind `w-*`/`h-*` utilities were not reliable at the time; Modal overlay positioning still has no equivalent fallback.

## Strategic recommendation

Pause this design-system migration for launch unless it is explicitly proven to be on the critical path. Do not continue the current incremental, block-by-block layering approach as-is.

The issue is not just one modal. The frontend now has legacy global CSS, a second globals file, design-system tokens, Tailwind utilities, duplicate Tailwind configs, direct primitive imports, adapters, and inline styles all coexisting. Build success can still leave browser behavior dependent on fragile cascade and config assumptions.

Before resuming migration, consolidate first: one active Tailwind config, one documented styling entrypoint, a clear adapter-vs-direct-import rule, and defensive wrappers for launch-critical primitives. Only then should page-by-page migration continue.

## Commands and files inspected

Read-only inspection included git branch/status/log/show/diff-stat commands and file reads for:

- `apps/web/src/components/Modal.tsx`
- `apps/web/src/design-system/components/Modal.tsx`
- `apps/web/src/pages/invoices/InvoicesPage.tsx`
- `apps/web/src/pages/clients/ClientsPage.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/styles/globals.css`
- `apps/web/src/design-system/tokens.css`
- `apps/web/tailwind.config.ts`
- `apps/web/src/design-system/tailwind.config.ts`
- `apps/web/postcss.config.js`
- `apps/web/package.json`
- `.cursor/rules/design-system-migration.mdc`

No local server/browser reproduction was started because code trace was sufficient and the task requested read-only investigation.

## Final status

- Files intentionally changed by this audit: `_audit_report.md` only.
- Backend/API/auth/schema/VPS/deploy: not touched.
- Package manifests: read only, not modified.
- Commits: none.
- Fixes: none.

GATE: STOP | agent: yes | budget: medium | mistakes: 1
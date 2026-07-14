# Canonical Component System — DCA OS Lite

**Decision status:** ESTABLISHED (Modal Wave COMPLETE 2026-07-13)
**Authority:** This document + Wave 0 import guard (`scripts/check-web-component-imports.mjs`)  
**Related:** [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) § Component system

---

## 1. Decision

| Layer | Path | Role |
|-------|------|------|
| **Canonical public API** | `apps/web/src/components/ui` | Only path product/pages may import for generic UI |
| **Canonical barrel** | `apps/web/src/components/ui/index.ts` | Preferred import surface |
| **Private foundation** | `apps/web/src/design-system` | Tokens, primitives, status map; adapters under `ui/` may import; **pages must not** |
| **Live app shell** | `apps/web/src/components/shell` + `AppLayout` | Not design-system `AppShell` / `Sidebar` / `Topbar` |
| **Canonical Modal** | `apps/web/src/components/ui/Modal.tsx` | DS Modal adapter + `document.body` portal; product size map + `eyebrow` |

Do **not** invent a third generic system. Do **not** edit `design-system/` source during leaf consolidation (foundation stays private).

---

## 2. Import conventions

**Allowed for pages / modules:**

```ts
import { Button, EmptyState, Badge, Spinner, Modal } from "../components/ui";
```

**Forbidden for new code:**

* `apps/web/src/components/Modal.tsx` — **removed**; recreating + importing remains guard-blocked
* Deep imports into `components/ui/<File>` from pages (use barrel)
* Page imports from `design-system` barrel or `design-system/components/*`
* Page/domain imports of `design-system/status` — use `components/ui` (`StatusBadge`, `normalizeStatusKey`, `STATUS`, …). Guard rule `ds-status-registry` (Visual Wave 3)
* New generic primitives under `components/` root without a `ui` adapter
* Replacing live shell with design-system Layout kit

**Allowed for `components/ui` adapters only:** deep/barrel imports from `design-system` including `status.ts` (guard exempts `ui/` and `design-system/` importers).

**Import allowlist:** `scripts/baselines/web-component-import-allowlist.json` stays at **0** entries.
---

## 3. Component family matrix

| Family | Canonical (import from `components/ui`) | Legacy / private | Migration status |
|--------|-------------------------------------------|------------------|------------------|
| Button | `ui/Button` → DS Button adapter | DS Button | Adapter DONE |
| Badge (tone) | `ui/Badge` | DS Badge (variant names differ) | Canonical for category / filter / metadata chips — not lifecycle |
| StatusBadge | `ui/StatusBadge` (`status`, optional `displayLabel`) + ClientStatusBadge/StatusDot | DS status map (private) | Visual Wave 3 contract: status→tone/`data-status`; displayLabel→text only |
| Spinner / Skeleton | `ui/Spinner` re-export | DS Spinner | DONE |
| LoadingState | `ui/LoadingState` | — (removed root shim) | DONE |
| EmptyState | `ui/EmptyState` (`title`/`message`) | DS EmptyState (`description`) — foundation only | Product API = ui |
| ErrorState | `ui/ErrorState` | — (removed root shim) | DONE |
| Alert / Toast / SuccessState | `ui/Alert` | DS Alert | Adapter DONE |
| Input / Textarea / Select / Checkbox / RadioGroup | `ui/FormFields` | DS FormFields | Adapter DONE |
| Table (simple) | `ui/Table` | — | DONE |
| Table (compound) | `CompoundTable`, `TableHead`, `Th`, `Td`, `TdDouble`, `ActivityItem` via ui barrel | DS Table | DONE |
| Tabs | `Tabs` via ui barrel | DS Tabs | DONE |
| Modal | `ui/Modal` — controlled `isOpen`, portal, size `sm\|md\|lg`, `eyebrow`, `closeOnBackdrop` | DS Modal (private shell); root `components/Modal` **deleted** | **Modal Wave COMPLETE** — 23/23 page consumers |
| PageHeader | `ui/PageHeader` only | DS PageHeader (different API — do not swap) | Locked |
| Card | Prefer MetricCard / SectionPanel | DS Card (no ui Card yet) | DEFERRED |
| Tooltip / Dropdown | Absent | — | DEFERRED (create only under ui when needed) |

---

## 4. Canonical Modal API

```ts
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";       // mapped → DS md|xl|full (preserve live widths)
  eyebrow?: string;                // → DS subtitle
  description?: string;            // → DS subtitle when eyebrow absent
  closeOnBackdrop?: boolean;       // default true
};
```

**Behavior:** Escape closes (via `useOverlayA11y`); backdrop follows `closeOnBackdrop`; focus trap + return focus + body scroll lock; `role="dialog"` + `aria-modal` + `aria-labelledby`; portal to `document.body`.

**Accessibility exceptions (documented):**

* `aria-describedby` not wired in DS shell (no DS edit without owner gate) — **DEFERRED** (subtitle `<p>` has no `id` / dialog `aria-describedby`)
* `role="alertdialog"` not used by product confirms yet — **DEFERRED**
* Nested dialog Escape: WP confirm over Deliverables — **MITIGATED** via Deliverables `isOpen={open && !wordpressPublishConfirm}`

---

## 5. Forbidden new patterns

1. Adding a second generic Modal under `components/` root.
2. Page imports of `design-system` Modal / ConfirmDialog.
3. New deep imports of `components/ui/<File>` from outside `components/ui`.
4. Forever dual Modal APIs (product must use `ui/Modal` only).

---

## 6. Compatibility-wrapper policy

* Modal Wave deleted `components/Modal.tsx` after all 23 page consumers migrated.
* Guard still blocks recreating/importing that path.
* Thin `ui` adapters over DS remain the only allowed bridge.

**Deletion criteria:** zero importers + guard baseline entry removed + validate PASS — **met for legacy Modal**.

---

## 7. Accessibility minimums

| Surface | Minimum |
|---------|---------|
| LoadingState | `role="status"` + polite live region |
| ErrorState / Alert danger | `role="alert"` via Alert |
| Spinner alone | Prefer `label` or wrap in LoadingState |
| Modal | focus trap, Escape, restore focus, `aria-modal`, labelled title, portal to body, scroll lock |
| Forms | label association preserved via FormFields |

---

## 8. Testing minimums

* Wave 0 import guard in `npm run -w @dca-os-v1/web check` (baseline may shrink to **0**).
* Guard `--self-test` must pass.
* Canonical Modal unit tests under `components/ui/Modal.test.tsx`.
* Migrated AI Delivery modal unit tests remain green.
* No weakening of TypeScript check.

---

## 9. Migration sequence

| Wave | Scope | Status |
|------|-------|--------|
| 0 | Import architecture guard + baseline freeze | COMPLETE (`250e958`; historical freeze 108) |
| 1 | Tabs/compound Table/ActivityItem via ui; delete unused state shims | COMPLETE (`1292e46`) |
| Modal Wave | Canonical `ui/Modal` DS adapter; migrate 23 consumers; delete legacy root Modal; baseline **0** | **COMPLETE** (this workstream) |
| Visual Wave 3 | Status/Badge convergence: `displayLabel`, brief→StatusBadge, status import guard, docs sync | **COMPLETE** (2026-07-14) — distinct from domain empty/loading clone wave below |
| 2 | Optional Badge visual alignment (chip geometry) | DEFERRED |
| 3 | Domain inline empty/loading clones → ui states | DEFERRED (naming collision with Visual Wave 3 — keep this row for empty/loading only) |
| Later | Card ui adapter; `aria-describedby` / `alertdialog` via gated DS change; Tooltip/Menu | DEFERRED |

---

## 10. Open exceptions

| Exception | Reason | Exit criteria |
|-----------|--------|---------------|
| DS Modal lacks `aria-describedby` | No DS edit in Modal Wave | Gated DS a11y hardening |
| ConfirmDialog `alertdialog` role | Showcase-only; pages use custom footers | Product Confirm via ui when needed |
| Nested dialog Escape ordering | Shared capture listeners | Dedicated nested-stack design |
| `components/ui` → `design-system` deep imports | Required adapters | Permanent for adapters; never for pages |
| DS EmptyState / Badge dual APIs | Product vs foundation props differ | Pages stay on ui |

---

## 11. Owner decisions still required

* Whether to schedule DS Modal a11y hardening (`aria-describedby`, `alertdialog`) — still requires DS edit gate.
* Whether to add a product `Card` adapter or keep MetricCard/SectionPanel only — **DEFER** (no staging blocker).
* Staging web-only Modal deploy + browser proof — **COMPLETE** on artifact `a447b9e` (2026-07-13); docs-closeout `67d9aa4`.

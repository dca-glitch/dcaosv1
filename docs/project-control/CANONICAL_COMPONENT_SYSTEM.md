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
* New generic primitives under `components/` root without a `ui` adapter
* Replacing live shell with design-system Layout kit

**Allowed for `components/ui` adapters only:** deep/barrel imports from `design-system` (guard exempts `ui/` importers).

---

## 3. Component family matrix

| Family | Canonical (import from `components/ui`) | Legacy / private | Migration status |
|--------|-------------------------------------------|------------------|------------------|
| Button | `ui/Button` → DS Button adapter | DS Button | Adapter DONE |
| Badge (tone) | `ui/Badge` | DS Badge (variant names differ) | Canonical product API = ui Badge |
| StatusBadge | `ui/StatusBadge` + ClientStatusBadge/StatusDot | DS status map | Adapter DONE |
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

* `aria-describedby` not wired in DS shell (no DS edit in this wave) — DEFERRED
* `role="alertdialog"` not used by product confirms yet — DEFERRED
* Nested dialog Escape stack order remains last-writer-wins — known limit; WP confirm still stacked over Deliverables

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
| 2 | Optional Badge visual alignment | DEFERRED |
| 3 | Domain inline empty/loading clones → ui states | DEFERRED |
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

* Whether to schedule DS Modal a11y hardening (`aria-describedby`, nested stack, `alertdialog`).
* Whether to add a product `Card` adapter or keep MetricCard/SectionPanel only.
* Staging web-only deploy + narrow Modal browser proof for this wave (required when runtime UI ships).

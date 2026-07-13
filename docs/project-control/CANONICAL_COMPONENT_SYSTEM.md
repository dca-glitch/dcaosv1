# Canonical Component System — DCA OS Lite

**Decision status:** ESTABLISHED (re-confirmed 2026-07-13)  
**Baseline commit:** `16ee06b` (pre-docs); workstream closeout follows on `main`  
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
| **Legacy modal bridge** | `apps/web/src/components/Modal.tsx` | Temporary; portals DS Modal; **Modal Wave separately gated** |

Do **not** invent a third generic system. Do **not** edit `design-system/` source during leaf consolidation (foundation stays private).

---

## 2. Import conventions

**Allowed for pages / modules:**

```ts
import { Button, EmptyState, Badge, Spinner } from "../components/ui";
// or equivalent relative depth
```

**Forbidden for new code:**

* `apps/web/src/components/{EmptyState,ErrorState,LoadingState,StatusNotice}.tsx` — **removed**; use `components/ui`
* Deep imports into `components/ui/<File>` from pages (use barrel)
* Page imports from `design-system` barrel or `design-system/components/*`
* New generic primitives under `components/` root or under `design-system/components/` for product use without a `ui` adapter
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
| Table (compound) | `CompoundTable`, `TableHead`, `Th`, `Td`, `TdDouble`, `ActivityItem` via ui barrel | DS Table | First-slice: page imports routed via ui |
| Tabs | `Tabs` via ui barrel | DS Tabs | First-slice: page imports routed via ui |
| Modal | **Deferred** — pages keep `components/Modal` | `ui/Modal` unused by pages; DS Modal | Modal Wave |
| PageHeader | `ui/PageHeader` only | DS PageHeader (different API — do not swap) | Locked |
| Card | Prefer MetricCard / SectionPanel | DS Card (no ui Card yet) | DEFERRED |
| Tooltip / Dropdown | Absent | — | DEFERRED (create only under ui when needed) |

---

## 4. Forbidden new patterns

1. Adding a second generic Empty/Loading/Error/Badge/Spinner under `components/` root.
2. New page imports of `design-system` or `design-system/components/*`.
3. New deep imports of `components/ui/<File>` from outside `components/ui`.
4. New forever wrappers that only rename DS without a product API reason.
5. Mass-migrating Modal without a dedicated gated wave + a11y proof.

---

## 5. Compatibility-wrapper policy

* Thin `ui` re-exports of DS are allowed when they stabilize the public API.
* Root legacy state shims were deleted once consumer count hit zero.
* `components/Modal.tsx` remains until Modal Wave replaces all call sites with one API.
* Wrappers must not accumulate a third parallel API.

**Deletion criteria:** zero importers + guard baseline entry removed + validate PASS.

---

## 6. Accessibility minimums

| Surface | Minimum |
|---------|---------|
| LoadingState | `role="status"` + polite live region (already) |
| ErrorState / Alert danger | `role="alert"` via Alert |
| Spinner alone | Prefer `label` or wrap in LoadingState |
| Modal (future wave) | focus trap, Escape, restore focus, `aria-modal`, labelled title, portal to body |
| Forms | label association preserved via FormFields |

---

## 7. Testing minimums

* Wave 0 import guard in `npm run -w @dca-os-v1/web check` (baseline shrink only when violations removed).
* Guard `--self-test` must pass.
* Migrated consumers covered by existing page/unit tests where present.
* No weakening of TypeScript check.

---

## 8. Migration sequence

| Wave | Scope | Status |
|------|-------|--------|
| 0 | Import architecture guard + baseline freeze | COMPLETE (`250e958`; historical freeze 108) |
| 1 (this slice) | Canonical doc; export Tabs/compound Table/ActivityItem via ui; migrate 3 page DS imports; delete unused state shims; shrink baseline to **24** | COMPLETE in this workstream |
| 2 | Optional Badge visual alignment / StatusBadge docs only | DEFERRED |
| 3 | Domain inline empty/loading clones → ui states | DEFERRED |
| Modal Wave | Unify Modal APIs; migrate ~23 consumers | DEFERRED — separately gated |
| Later | Card ui adapter; Tabs-heavy surfaces; Tooltip/Menu when product needs | DEFERRED |

---

## 9. Open exceptions

| Exception | Reason | Exit criteria |
|-----------|--------|---------------|
| `components/Modal` page imports | High a11y/API risk | Modal Wave complete |
| `components/ui` → `design-system` deep imports | Required adapters | Permanent for adapters; never for pages |
| `design-system/status` / `panel` / `useOverlayA11y` from ui | Explicit guard allow-outs | Keep; do not expand casually |
| DS EmptyState / Badge dual APIs | Product vs foundation props differ | Pages stay on ui; DS for foundation/showcase |

---

## 10. Owner decisions still required

* When to schedule **Modal Wave**.
* Whether to add a product `Card` adapter or keep MetricCard/SectionPanel only.
* Whether to move `vite` (and similar) out of web `dependencies` (hygiene; separate workstream).

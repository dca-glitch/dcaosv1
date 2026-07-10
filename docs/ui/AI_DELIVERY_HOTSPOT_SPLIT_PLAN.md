# AI Delivery Hotspot Split Plan (G668)

**Status:** Planning / docs only (Lane 17 / G661–G672). No behavioral split in this lane.  
**Primary hotspot:** `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` (~5765 lines)  
**Prior:** [`ai-delivery-hotspot-file-review.md`](./ai-delivery-hotspot-file-review.md)

## Why this is a hotspot

| Signal | Observation |
|--------|-------------|
| Size | Largest frontend page module in the repo |
| Coupling | Types, helpers, inline state UI, and most lane modals live in one file |
| Conflict risk | Any polish block touching lanes/modals fights other AI Delivery work |
| Prior extracts | Picker, operator summary, workspace sections, WP confirm modal, MonthlyReportPanel, Knowledge panel already pulled out |

## Current folder map (line counts 2026-07-10)

| File | ~Lines | Already extracted? | Split priority |
|------|--------|--------------------|----------------|
| `AiDeliveryPage.tsx` | 5765 | — | Phase A–C target |
| `MonthlyReportPanel.tsx` | 1595 | Yes | Secondary hotspot; polish OK |
| `AiKnowledgeContextPanel.tsx` | 313 | Yes | Low |
| `AiDeliveryProjectWorkspaceSections.tsx` | 293 | Yes | UX-P3/P4 target |
| `AiDeliveryOperatorSummary.tsx` | 58 | Yes | UX-P2 |
| `AiDeliveryWordPressPublishConfirmModal.tsx` | 64 | Yes | Done |
| `AiDeliveryProjectPicker.tsx` | 44 | Yes | Done |

## Recommended split phases (cosmetic → structural)

### Phase A — Types extract (UX-P14, lowest risk)

- Move exported `type` / form value types to `ai-delivery-types.ts`.
- Re-export from `AiDeliveryPage.tsx` so App.tsx imports stay stable.
- **No** behavior change. Validate: `web check` + existing smokes unchanged.

### Phase B — Pure helpers extract

- Move formatters, status option helpers, preview parsers, packaging predicates to `ai-delivery-formatters.ts` / `ai-delivery-workflow-run-helpers.ts`.
- Keep React components in place.
- Add focused unit tests for pure helpers only.

### Phase C — Modal / section components (one lane at a time)

Extract **one** modal family per approved block, e.g.:

1. Content plan modal  
2. Content draft modal  
3. Article images modal  
4. Deliverables + reviews modal  
5. Workflow runs modal  
6. Research request/summary/source modals  

Rules per block:

- ≤3 files touched when possible  
- Preserve exact copy strings unless copy-safety overclaim  
- Do not change App.tsx hash routing or AppLayout  
- Do not touch `design-system/`  

### Phase D — Page shell slim-down

- `AiDeliveryPage` becomes composition + data wiring only.
- Shared `LoadingState` / `ErrorState` at shell (see [`UI_EMPTY_ERROR_STATE_SAFETY.md`](./UI_EMPTY_ERROR_STATE_SAFETY.md)).

## Do not do in one gate

- Mass rewrite or prettier/format of the whole file  
- Mixing Phase C extracts with backend/API changes  
- Replacing shell with design-system AppShell  
- Editing `client-portal-api*` (Lane 9)

## Validation per phase

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run -w @dca-os-v1/web check
```

Optional after helper extract: `npm.cmd run -w @dca-os-v1/web test:unit`

## Related

- [`ADMIN_SURFACE_INVENTORY.md`](./ADMIN_SURFACE_INVENTORY.md)  
- [`admin-data-dense-ui.md`](./admin-data-dense-ui.md)  
- Deferred register: large AiDelivery modal refactor remains deferred until Phase C gates are owner-approved one at a time.

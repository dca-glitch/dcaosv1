# UI Empty / Error State Safety (G670)

**Status:** Docs inventory + safety rules (Lane 17 / G661–G672). No broad page rewrites.  
**Shared components:** `EmptyState`, `ErrorState`, `LoadingState` under `apps/web/src/components/`.

## Shared primitives

| Component | File | Notes |
|-----------|------|-------|
| `EmptyState` | `components/EmptyState.tsx` | `page` \| `inline`; title + message + optional action |
| `ErrorState` | `components/ErrorState.tsx` | Wraps design-system `Alert` danger |
| `LoadingState` | `components/LoadingState.tsx` | Spinner + label |

Lane 17 must **not** modify `apps/web/src/design-system/`. Composing existing wrappers is preferred.

## Safety rules

1. Empty/error copy must not claim live integrations, production readiness, or “connected” providers.
2. Prefer deferred / local / manual / unavailable wording for metrics and integrations.
3. Client portal empty states must follow client wording guide — no proof-state chips.
4. Error messages shown to clients must stay redacted (no storage keys, provider payloads, stack traces).
5. Prefer shared `EmptyState` / `ErrorState` / `LoadingState` over one-off panels when touching a page in an approved polish gate.

## Adoption snapshot (illustrative)

| Surface | Shared Empty/Error/Loading | Notes |
|---------|----------------------------|-------|
| Market Intelligence | Yes | Good reference |
| Workflow Briefs | Yes | Good reference |
| Clients / Projects / Invoices / Bills | EmptyState | Mixed density |
| AI Delivery | EmptyState in places | Shell still mixed (UX-P5) |
| MonthlyReportPanel | EmptyState | Copy-safety applied |
| Client Portal | EmptyState inline | Lane 9/portal owner for further polish |

## Deferred proposals (do not implement here)

| ID | Proposal | Owner |
|----|----------|-------|
| ES-1 | AiDeliveryPage shell: shared Loading/Error at top level | Future Phase D hotspot |
| ES-2 | AdminOperationsPanel: EmptyState for missing readiness categories | Future polish |
| ES-3 | Portal CP-1/CP-3 empty copy polish | Portal page owner |

## Related

- [`MONTHLY_REPORT_UI_TESTABILITY.md`](./MONTHLY_REPORT_UI_TESTABILITY.md)  
- [`CLIENT_PORTAL_UI_TESTABILITY.md`](./CLIENT_PORTAL_UI_TESTABILITY.md)  
- [`AI_DELIVERY_HOTSPOT_SPLIT_PLAN.md`](./AI_DELIVERY_HOTSPOT_SPLIT_PLAN.md)  

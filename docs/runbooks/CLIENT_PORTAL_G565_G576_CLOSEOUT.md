# Client Portal G565–G576 Closeout

**Status:** Lane 9 local closeout (implementation + focused unit tests).  
**Baseline:** `main` @ `66dcb74`.  
**Scope:** Client portal safety / API / web — no RBAC weakening, no commit/push/deploy.

Related:

- [`docs/architecture/CLIENT_PORTAL_BOUNDARY.md`](../architecture/CLIENT_PORTAL_BOUNDARY.md)
- [`docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md`](./CLIENT_PORTAL_ROUTE_INVENTORY.md)
- [`docs/architecture/CLIENT_PORTAL_SERIALIZER_NO_LEAK.md`](../architecture/CLIENT_PORTAL_SERIALIZER_NO_LEAK.md)

---

## Gate map

| Gate | Result | Proof |
|---|---|---|
| G565 Client serializer no-leak tests | DONE | `client-portal-serializer.ts` + `.test.ts` |
| G566 Internal status no-leak tests | DONE | Internal status constants + archive guards in serializer tests |
| G567 Provider metadata no-leak tests | DONE | Forbidden-key strip/detect for `provider` / `providerMetadata` |
| G568 StorageKey no-leak tests | DONE | `toClientPortalSafeDownloadReference` + monthly `hasDocument` |
| G569 Raw cost no-leak tests | DONE | `actualCostUsd` / `estimatedCostUsd` / `rawCost` / `costRows` |
| G570 Error safety tests | DONE | API `client-portal-error-safety` + web UI safe message patterns |
| G571 Monthly report FINAL-only tests | DONE | Visibility helpers + serializer archive status tests |
| G572 Archive final-only tests | DONE | `DELIVERED`/`ACCEPTED` only |
| G573 Approval request/action policy tests | DONE (surface) | `client-portal-approval-request-safety.test.ts` + edit-field denylist; full policy matrix = Lane 10 |
| G574 Client route inventory update | DONE | Route inventory + router inventory comment |
| G575 Client portal docs closeout | DONE | This file + serializer no-leak architecture note |
| G576 Lane validation | DONE | Focused unit tests only (no full `validate`) |

---

## Files touched (Lane 9 ownership)

### New

- `apps/api/src/core/client-portal-serializer.ts`
- `apps/api/src/core/client-portal-serializer.test.ts`
- `apps/api/src/core/client-portal-approval-request-safety.test.ts`
- `docs/architecture/CLIENT_PORTAL_SERIALIZER_NO_LEAK.md`
- `docs/runbooks/CLIENT_PORTAL_G565_G576_CLOSEOUT.md`

### Updated

- `apps/api/src/core/client-portal.runtime.ts` — download envelopes via safe helper
- `apps/api/src/core/client-portal.runtime.test.ts` — G571/G572 labels
- `apps/api/src/core/client-portal-error-safety.ts` — broader unsafe markers
- `apps/api/src/core/client-portal-error-safety.test.ts` — G570 coverage
- `apps/api/src/core/client-portal-edit.runtime.test.ts` — G573 surface / no RBAC weaken
- `apps/api/src/routes/client-portal.ts` — inventory comment only
- `apps/web/src/pages/client-portal/client-portal-api.ts` — UI error markers
- `apps/web/src/pages/client-portal/client-portal-api.test.ts` — cost/provider UI safety
- `docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md` — serializer ownership row

### Not touched (other lanes / forbidden)

- `client-portal-approval-policy*`, `client-portal-approval.runtime*`, `client-portal-approval.controller*` (Lane 10)
- `client-portal-monthly-report.test.ts` (Lane 6)
- `.cursor/settings.json`, main-owned STATUS / deferred-register docs
- Backend RBAC, schema, auth, package.json

---

## Validation (focused)

```powershell
cd C:\dcaosv1
node --import tsx --test apps/api/src/core/client-portal-serializer.test.ts
node --import tsx --test apps/api/src/core/client-portal-error-safety.test.ts
node --import tsx --test apps/api/src/core/client-portal.runtime.test.ts
node --import tsx --test apps/api/src/core/client-portal-edit.runtime.test.ts
node --import tsx --test apps/api/src/core/client-portal-approval-request-safety.test.ts
npm.cmd run -w @dca-os-v1/web test:unit -- src/pages/client-portal/client-portal-api.test.ts
```

Focused results (this lane): API suites **33 pass / 0 fail**; web `client-portal-api.test.ts` **12 pass / 0 fail**.  
Full monorepo `validate` was intentionally not run (lane instruction).

---

## Deferred proposals (do not implement here)

1. **Staging/prod browser proof** — FINAL-only archive + no `storageKey` leak against staging after owner approval (existing deferred register item).
2. **Durable revision-round schema** — policy-ready; persistence remains Lane 10 / schema-approved follow-up.
3. **Delivery-summary status vocabulary** — `contentPlanStatus` / MI `handoffStatus` are client-facing product statuses today; a future pass may map them to friendlier labels without exposing admin workflow enums (no change in this lane).
4. **Shared web/API unsafe-pattern module** — web duplicates a subset of API patterns; optional later consolidation without package churn.

---

## Confirmations

- No commit / push / deploy.
- No RBAC weakening.
- No schema / migration / auth / Turnstile / VPS / production changes.
- Client-safe only: serializers prove no leak of internal status, provider metadata, `storageKey`, or raw cost.

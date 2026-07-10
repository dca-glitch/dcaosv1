# Client Portal UI Testability (G667)

**Status:** Docs-only (Lane 17 / G661–G672). Lane 9 owns `client-portal-api*`; portal page code out of Lane 17.  
**Surfaces:** [`CLIENT_PORTAL_SURFACE_INVENTORY.md`](./CLIENT_PORTAL_SURFACE_INVENTORY.md)  
**Prior:** [`docs/ux/client-portal-ui-testability.md`](../ux/client-portal-ui-testability.md)

## What to prove

| Concern | Expected |
|---------|----------|
| Field boundary | No `storageKey`, workflow/provider internals in client JSON/UI |
| Status labels | Internal DRAFT/PENDING hidden or remapped |
| Approvals | Article + per-image approve/reject/undo; `IMAGES_PENDING` gate |
| FINAL archive | Only DELIVERED/ACCEPTED / FINAL client-safe artifacts |
| Wording | Client wording guide; no admin proof-state chips |

## Existing automation

| Phase | Script(s) | Level | Status |
|-------|-----------|-------|--------|
| Send-for-review + deferred gate | `smoke-client-approval-happy-path-local.mjs` | API | Covered |
| Pending-approvals list | same + `smoke-puriva-client-portal-boundary-local.mjs` | API + browser | Covered |
| Article approve | happy-path smoke | API + browser | Covered |
| Article reject (Request changes) | happy-path | API only | Partial |
| Image approve | publication-handoff browser (setup) | API-ish | Partial |
| Image reject / undo | — | — | **Gap** |
| `IMAGES_PENDING` gate | — | — | **Gap** |
| Final visibility | `smoke-client-final-visibility-local.mjs` | API | Covered |
| Unit | `client-portal-api.test.ts` | Unit | Narrow (Lane 9) |

## Gaps (propose only)

| ID | Gap | Owner |
|----|-----|-------|
| UXP-A1 | Image reject/undo zero coverage | Smoke / portal owner |
| UXP-A2 | Article reject not browser-driven | Smoke |
| UXP-A3 | `CLIENT_APPROVAL_IMAGES_PENDING` untested | Smoke |
| UXP-A4 | No `npm run smoke:client-approval-*` aliases | package.json owner (out of UI lane) |
| CP-T1 | Status-label fallthrough title-cases unknown enums | Portal unit test candidate (not Lane 17) |

## Recommended commands (no new scripts; Lane 17 does not run smoke)

```powershell
cd C:\dcaosv1
$env:AUTH_SEED_TEST_PASSWORD = "<local seed password>"
npm.cmd run dev:api
npm.cmd run dev:web
node scripts/smoke-client-approval-happy-path-local.mjs
node scripts/smoke-client-final-visibility-local.mjs
npm.cmd run smoke:puriva-full-delivery:local
```

Post-login browser QA may be blocked by local auth/dev env — report and continue with check/build only.

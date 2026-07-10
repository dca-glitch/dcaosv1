# Client Portal UI Testability (docs review)

**Status:** Docs-only (G429–G448). Lane 6 owns portal page code.  
**Surfaces:** [`docs/ui/client-portal-surface-inventory.md`](../ui/client-portal-surface-inventory.md)

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
| Unit | `client-portal-api.test.ts` | Unit | Narrow |

## Gaps (propose only)

| ID | Gap | Owner |
|----|-----|-------|
| UXP-A1 | Image reject/undo zero coverage | Smoke / Lane 6 |
| UXP-A2 | Article reject not browser-driven | Smoke |
| UXP-A3 | `CLIENT_APPROVAL_IMAGES_PENDING` untested | Smoke |
| UXP-A4 | No `npm run smoke:client-approval-*` aliases | package.json owner (out of UI lane) |
| CP-T1 | `toClientPortalStatusLabel` fallthrough title-cases unknown enums | Lane 6 unit test candidate |

## Recommended commands (no new scripts)

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

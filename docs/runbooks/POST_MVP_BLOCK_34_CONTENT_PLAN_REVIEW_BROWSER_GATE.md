# Post-MVP Block 34 — Content Plan Review Browser Gate

**Status:** Local browser gate for the client-safe content plan review shell.

**Scope:** Playwright proof for `#/content-plan-review` using an API-seeded fixture (client access + content plan in `CLIENT_REVIEW_REQUESTED`). No schema, API contract, auth, or backend changes.

Related:

- `apps/web/src/App.tsx` (`ClientContentPlanReviewView`)
- `scripts/smoke-content-plan-review-browser-local.mjs`
- `scripts/smoke-ai-delivery-reviews-local.mjs` (API review flow reference)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:content-plan-review:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Fixture client/project/content plan exists with client access grant
- Content plan is in `CLIENT_REVIEW_REQUESTED` and client-review API returns data
- Browser loads **Monthly Content Plan Review** view
- **Load content plan** renders **Review status** with fixture item title
- Approve / Request changes actions are visible (read-only gate; no click required)

# Post-MVP Block 35 — Content Draft Review Browser Gate

**Status:** Local browser gate for the client-safe content draft review shell.

**Scope:** Playwright proof for `#/content-draft-review` using an API-seeded fixture (client access + draft in `READY_FOR_REVIEW`). No schema, API contract, auth, or backend changes.

Related:

- `apps/web/src/App.tsx` (`ClientContentDraftReviewView`)
- `scripts/smoke-content-draft-review-browser-local.mjs`
- `docs/runbooks/POST_MVP_BLOCK_34_CONTENT_PLAN_REVIEW_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:content-draft-review:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Fixture client/project/content plan item/content draft exists with client access grant
- Draft is in `READY_FOR_REVIEW` and client-review API returns data
- Browser loads **Content Draft Review** view
- **Load content drafts** renders a draft card with fixture title and body
- Approve draft / Request changes actions are visible

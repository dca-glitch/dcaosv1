# Puriva MVP Block 16 — Client Portal Empty Archive Browser Gate

**Status:** Local browser gate for empty final deliverables and empty finalized monthly reports in Client Portal UI.

**Scope:** Playwright proof that DRAFT-only deliverables and DRAFT monthly reports stay hidden while the portal renders client-safe empty states.

Related:

- `scripts/smoke-client-portal-empty-archive-browser-local.mjs`
- `scripts/smoke-client-portal-monthly-report-browser-local.mjs` (populated FINAL path)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:empty-archive:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Portal deliverables API returns empty list for DRAFT-only project
- Portal monthly reports API returns empty list for DRAFT-only report
- UI shows `No final deliverables yet` and hides DRAFT deliverable title
- UI shows `No finalized reports yet` and hides DRAFT report title

# Post-MVP Block 38 — Email Outbox Read-Only Local Gate

**Status:** Local smoke gate for tenant-scoped email notification outbox reads.

**Scope:** Read-only `GET /notifications/email-logs` plus smoke proof that AI Delivery system events append `EmailLog` rows with `SKIPPED` status and no provider delivery. No real email sending, queues, or Resend key handling.

Related:

- `docs/email-notifications-contract.md`
- `apps/api/src/services/email-notifications.service.ts`
- `scripts/smoke-email-outbox-local.mjs`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:email-outbox:local
```

Included in `npm run smoke:pre-staging:local`.

**Restart local API** after pulling this block so the new route is loaded.

---

## Pass criteria

- Admin login succeeds
- `GET /notifications/email-logs` returns tenant-scoped logs and safe outbox status (`sendingEnabled: false`)
- Response does not expose secrets (`RESEND_API_KEY`, password hashes, etc.)
- Creating an AI Delivery project appends an internal `EmailLog` row (`AI_DELIVERY` module, `SKIPPED`)
- Status filter `?status=SKIPPED` returns SKIPPED rows only

---

## Notes

- `EmailLog` remains EN1 scaffolding; platform audit history stays in `AuditLog`.
- Real Resend sending remains deferred by owner gate.

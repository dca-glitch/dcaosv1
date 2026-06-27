# Phase F Block 75 — Email EN2 Lite

**Scope:** Read-only outbox + AuditLog event mapping. No Resend sending.

Related:

- [`POST_MVP_BLOCK_38_EMAIL_OUTBOX_READ_ONLY_LOCAL_GATE.md`](./POST_MVP_BLOCK_38_EMAIL_OUTBOX_READ_ONLY_LOCAL_GATE.md)
- `apps/api/src/services/email-notifications.service.ts`
- `scripts/smoke-email-outbox-local.mjs`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:email-outbox:local
```

## Pass criteria

- Outbox list endpoint reachable read-only
- Smoke PASS without live email provider
- No recipient secrets or message bodies with credentials in output

## Deferred

- Resend / production email sending

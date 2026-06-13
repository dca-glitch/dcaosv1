# DCA OS v1 - Auth Seed Execution Plan

This document captures the future local seed sequence for DB-1 bootstrap work.

No seed is approved yet.
No seed run is included in this block.

## 1. Bootstrap Target

- initial tenant: Digital Cube Agency
- initial admin user must be created without documenting any plaintext password
- initial password must be provided out-of-band or generated locally later
- store password hash only
- `forcePasswordChange = true`

## 2. Membership / Role Setup

- create `TenantMembership` for the admin user
- assign owner/admin role through `MembershipRole`
- create initial roles
- create initial permissions
- create initial modules

## 3. Audit Expectations

- create bootstrap audit events as system events if supported
- keep audit metadata free of secrets
- avoid plaintext password material in logs or metadata

## 4. Local Safety

- keep the bootstrap local-only until approval
- do not run the seed in this block
- do not document production seed execution

## 5. Existing Script Readiness

The repo already contains `packages/data/scripts/seed-db1.mjs`.

That script should be treated as readiness-only for now and not executed in this block.

## 6. Future Command

Only after approval:

```powershell
npm.cmd run -w @dca-os-v1/data seed:db1:local
```

## 7. Status

Planning only. No seed is run here.

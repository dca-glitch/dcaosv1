# DCA OS v1 - Internal Bootstrap Plan

## 1. Executive Summary

Local-only idempotent DB-1 seed implementation is approved for planning and safe local execution.

No production seed is approved.

## 2. Bootstrap Goals

- first DCA tenant
- first internal admin user
- default permissions
- default roles
- default module definitions
- tenant modules
- baseline settings

## 3. Bootstrap Data Plan

Include:

- Tenant: Digital Cube Agency
- User: placeholder email only, no real secret
- TenantMembership
- Role: owner, admin, member, viewer maybe
- owner/admin membership if safe
- Permission catalog
- ModuleDefinition catalog
- TenantModule enablement
- TenantSetting non-secret defaults
- AuditLog bootstrap event

## 4. Safety Rules

- local-only first
- no production seed until deployment gate
- no passwords
- no real secrets
- placeholder admin email only
- idempotent seed
- dry-run mode if possible later
- refuse unsafe DATABASE_URL values

## 5. Human Inputs Needed

- final admin email
- tenant slug
- enabled modules
- default role names
- auth provider choice
- whether the placeholder admin email should be `admin@example.local` or `dca-admin@example.local`

## 6. Future Seed Command

Document only. Do not create or run a seed command unless later approved.

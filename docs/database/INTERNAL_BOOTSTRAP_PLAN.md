# DCA OS v1 - Internal Bootstrap Plan

## 1. Executive Summary

No seed execution now.

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
- idempotent seed
- dry-run mode if possible later

## 5. Human Inputs Needed

- final admin email
- tenant slug
- enabled modules
- default role names
- auth provider choice

## 6. Future Seed Command

Document only. Do not create or run a seed command unless later approved.

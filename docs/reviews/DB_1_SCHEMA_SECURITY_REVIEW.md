# DCA OS v1 - DB-1 Schema Security Review

## 1. Executive Verdict

PASS FOR MIGRATION READINESS PLANNING.

The Prisma implementation can remain as-is for the next planning step. Migrations remain blocked, runtime DB access remains blocked, and auth remains blocked.

## 2. Validation Results

- `git status --short --branch`: clean, synced with `origin/main`
- `npm.cmd run check`: pass
- `npm.cmd run build`: pass
- `npm.cmd run -w @dca-os-v1/data prisma:validate`: pass
- `npm.cmd run -w @dca-os-v1/data check`: pass

## 3. Tenant Isolation Review

- Tenant model exists and is the workspace boundary: pass
- User model exists and is global identity: pass
- TenantMembership exists: pass
- TenantUser model does not exist: pass
- UserRole model does not exist for tenant access: pass
- TenantMembership has `tenantId` and `userId`: pass
- TenantMembership has unique `tenantId + userId`: pass
- Tenant roles are membership-bound through MembershipRole: pass
- Role is tenant-scoped with `tenantId`: pass
- Role has tenant-scoped unique key `tenantId + key`: pass
- Permission is global/system-defined: pass
- Permission has unique key: pass
- RolePermission does not contain `userId`: pass
- MembershipRole does not contain `userId`: pass
- TenantModule is tenant-scoped: pass
- TenantSetting is tenant-scoped and treated as non-secret config by policy: pass
- AuditLog includes `actorType`: pass
- AuditLog supports nullable `tenantId` for platform/system events: pass
- AuditLog supports nullable `actorUserId` for system, automation, and API actors: pass
- No auth, session, password, OAuth, or JWT models were added: pass
- No future module tables were added too early: pass

## 4. RBAC Boundary Review

The RBAC boundary is coherent:

- `Role` stays tenant-scoped
- `Permission` stays global/system-defined
- `RolePermission` is a clean role-to-permission join
- `MembershipRole` is the only tenant-access assignment path
- tenant access does not flow through `UserRole`

This matches the approved DB-1 direction.

## 5. AuditLog Review

`AuditLog` is structurally sound for the first security/activity layer:

- `actorType` is present
- `actorUserId` is nullable
- `tenantId` is nullable only for platform/system events by policy
- `action`, `entityType`, `entityId`, `metadata`, `ipAddress`, `userAgent`, and `createdAt` are present
- append-only handling remains a policy rule rather than a Prisma feature

The current index set is usable, though a future compound `tenantId + createdAt` index may be worth revisiting if audit query volume grows.

## 6. Settings/Secrets Review

- `TenantSetting` is the only DB-1 settings table: pass
- `value` is typed as `Json`, which is appropriate for non-secret configuration
- `valueType` keeps the payload shape explicit: pass
- `moduleKey` is optional and used only as grouping metadata: pass
- no plaintext secret policy remains intact: pass

## 7. Early Scope Guard

The following excluded models are still excluded:

- Session
- Password
- OAuthAccount
- Project
- WorkItem
- Contact
- CompanyRecord
- Billing
- SEO
- AI workflow
- KnowledgeBase
- ClientPortal

## 8. Findings

### Critical blockers

None.

### High risks

None.

### Medium risks

- `AuditLog` may benefit from a future compound `tenantId + createdAt` index if audit reads become tenant-and-time heavy.

### Low cleanup

- The validator script confirms model presence and legacy exclusions, but it does not enforce every field-level constraint. That is acceptable for this phase, but it means the Prisma review still matters.

## 9. Required Schema Patch, If Any

None.

## 10. Gate Recommendation

Proceed to migration readiness planning.


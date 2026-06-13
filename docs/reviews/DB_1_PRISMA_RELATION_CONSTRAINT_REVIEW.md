# DCA OS v1 - DB-1 Prisma Relation and Constraint Review

## 1. Executive Verdict

PASS.

The schema is coherent enough for migration readiness planning, with no required patch before planning continues.

## 2. Model-by-Model Review

### Tenant

- Relations: memberships, roles, tenant modules, tenant settings, audit logs.
- Indexes/unique: `slug` is unique.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`, `deletedAt`.
- Concerns: none material.

### User

- Relations: memberships and audit logs.
- Indexes/unique: `email` is unique.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`, `deletedAt`.
- Concerns: none material.

### TenantMembership

- Relations: tenant, user, membership roles.
- Indexes/unique: unique `tenantId + userId`, indexes on `tenantId`, `userId`, and `status`.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`, `deletedAt`.
- Concerns: none material.

### Role

- Relations: tenant, role permissions, membership roles.
- Indexes/unique: unique `tenantId + key`, index on `tenantId`.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`, `deletedAt`.
- Concerns: tenant-scoped design is clear.

### Permission

- Relations: role permissions.
- Indexes/unique: unique `key`, index on `moduleKey`.
- Lifecycle fields: `createdAt`, `updatedAt`.
- Concerns: no material issue for DB-1.

### RolePermission

- Relations: role, permission.
- Indexes/unique: unique `roleId + permissionId`, indexes on both foreign keys.
- Lifecycle fields: `createdAt`.
- Concerns: clean join model, no userId leakage.

### MembershipRole

- Relations: tenantMembership, role.
- Indexes/unique: unique `tenantMembershipId + roleId`, indexes on both foreign keys.
- Lifecycle fields: `createdAt`.
- Concerns: clean assignment path for membership-bound roles.

### ModuleDefinition

- Relations: tenant modules.
- Indexes/unique: unique `key`, index on `status`.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`.
- Concerns: none material.

### TenantModule

- Relations: tenant, moduleDefinition.
- Indexes/unique: unique `tenantId + moduleDefinitionId`, indexes on `tenantId`, `moduleDefinitionId`, and `status`.
- Lifecycle fields: `status`, `createdAt`, `updatedAt`.
- Concerns: `onDelete: Restrict` on moduleDefinition is conservative and acceptable.

### TenantSetting

- Relations: tenant.
- Indexes/unique: unique `tenantId + key`, indexes on `tenantId` and `moduleKey`.
- Lifecycle fields: `createdAt`, `updatedAt`.
- Concerns: `Json` value type is appropriate for non-secret config rows.

### AuditLog

- Relations: tenant and actor user.
- Indexes/unique: indexes on `tenantId`, `actorUserId`, `action`, `entityType + entityId`, and `createdAt`.
- Lifecycle fields: `createdAt`.
- Concerns: a future compound `tenantId + createdAt` index could help tenant-scoped audit queries, but the current structure is valid.

## 3. Constraint Review

Required constraints and status:

- User email unique: exists
- Tenant slug unique: exists
- TenantMembership unique `tenantId + userId`: exists
- Role unique `tenantId + key`: exists
- Permission key unique: exists
- RolePermission unique `roleId + permissionId`: exists
- MembershipRole unique `tenantMembershipId + roleId`: exists
- ModuleDefinition key unique: exists
- TenantModule unique `tenantId + moduleDefinitionId`: exists
- TenantSetting unique `tenantId + key`: exists

## 4. Nullable Field Review

- `Tenant.deletedAt`: justified
- `User.name`: justified
- `User.deletedAt`: justified
- `TenantMembership.deletedAt`: justified
- `Role.description`: justified
- `Role.deletedAt`: justified
- `Permission.moduleKey`: justified
- `Permission.description`: justified
- `TenantSetting.moduleKey`: justified
- `AuditLog.tenantId`: justified for platform/system events
- `AuditLog.actorUserId`: justified for non-user actors
- `AuditLog.entityId`: justified
- `AuditLog.metadata`: justified
- `AuditLog.ipAddress`: justified
- `AuditLog.userAgent`: justified

## 5. Delete/Cascade Review

- `TenantMembership` cascades from tenant and user: acceptable for the current empty/foundation state, though this should remain review-gated before any production data exists.
- `Role`, `RolePermission`, and `MembershipRole` cascades are structurally coherent.
- `TenantModule` uses `Restrict` on moduleDefinition, which is conservative and safe.
- `AuditLog` uses `SetNull` on tenant/user relations, which preserves history if a parent row is removed.

No destructive cascade issue requires a patch for the current phase.

## 6. Validator Review

`packages/data/scripts/validate-prisma-schema.mjs` now checks:

- the approved DB-1 model set exists
- legacy foundation models are absent
- disallowed migration/generate wording is not embedded in the schema text

That is sufficient for the current planning phase, but it is still a structural validator rather than a full constraint auditor.

## 7. Required Fixes

None.

## 8. Recommendation

Proceed with migration readiness planning.


# DCA OS v1 - RBAC Middleware Plan

## 1. Executive Summary

No runtime implementation yet.

## 2. RBAC Principles

- User authenticates identity
- TenantMembership proves workspace access
- MembershipRole links membership to Role
- RolePermission links Role to Permission
- Permission keys are global or system-defined

## 3. Permission Key Pattern

Use `module:action`.

Examples:

- users:read
- users:invite
- roles:manage
- modules:manage
- settings:read
- settings:update
- audit:read

## 4. Future Middleware Sequence

- requireAuth
- requireTenant
- requirePermission

## 5. Permission Resolution

Later permission loading should:

- start from authenticated identity
- resolve the active TenantMembership
- collect roles attached to membership
- collect permissions attached to roles
- expose a safe permission set to downstream handlers

## 6. Denied Access Handling

- return safe 403
- audit sensitive denies
- do not leak tenant existence

## 7. Client Portal Role Boundaries

- limited roles
- no inheritance from DCA internal admin
- explicit module permissions only

## 8. Future Implementation Files

No implementation yet.

## 9. Test Plan Later

- forbidden permission tests
- missing membership tests
- tenant mismatch deny tests

## 10. Open Decisions

- permission caching strategy
- whether system context can bypass tenant permission checks
- whether denied audit events are required for every 403 or only sensitive actions

# DCA OS v1 - DB-1 Prisma Schema Plan

## 1. Executive Summary

This document is planning only.

- no Prisma schema change is approved by this document alone
- no migrations are approved
- no database runtime connection is approved
- Auth implementation remains blocked
- DB-1 goal is the secure platform foundation

The purpose of DB-1 is to define the first reviewed Prisma schema boundary for a multi-tenant SaaS platform that can safely support future modules without overcommitting to business-specific tables too early.

## 2. Approved Design Inputs

This plan is based on the approved database/security decisions:

- `TenantMembership` is the canonical access boundary
- `User` is global identity
- `Tenant` is the workspace boundary
- roles attach to membership, not directly to user
- permissions are global/system-defined in DB-1
- `AuditLog` is append-only and includes `actorType`
- `TenantModule` and `TenantSetting` are the core tenant-scoped control surfaces
- tenant isolation rules require service-layer enforcement later
- normal settings must not store plaintext secrets

## 3. DB-1 Scope

### Approved DB-1 candidate models

- Tenant
- User
- TenantMembership
- Role
- Permission
- RolePermission
- MembershipRole
- ModuleDefinition
- TenantModule
- TenantSetting
- AuditLog
- Session

### Explicitly excluded from DB-1

- Project
- WorkItem
- Contact
- CompanyRecord / ClientRecord
- Billing records
- SEO automation records
- AI workflow records
- KnowledgeBase records
- ClientPortal records
- Session/Auth tables are approved separately via Auth Gate and may be included in the controlled auth foundation
- Password/JWT/session implementation

## 4. Canonical Model Classification

| Model | Scope | tenantId rule | Purpose | Implementation priority |
|---|---|---|---|---|
| User | Global/platform | no tenantId | Global identity record for platform users | High |
| Tenant | Global/platform | no tenantId | Workspace/organization boundary | High |
| Permission | Global/platform | no tenantId in DB-1 | Global permission catalog | High |
| ModuleDefinition | Global/platform | no tenantId | Global module catalog and version metadata | High |
| TenantMembership | Tenant-scoped | tenantId required | Links user to tenant and defines access boundary | High |
| Role | Tenant-scoped or system-scoped by explicit scope | tenantId required for tenant roles; null only if a global/system role is explicitly approved later | Access template within a tenant scope | High |
| RolePermission | Follows role scope | tenantId required if role is tenant-scoped | Grants permissions to a role | High |
| MembershipRole | Tenant-scoped | tenantId required via membership | Assigns roles to a tenant membership | High |
| TenantModule | Tenant-scoped | tenantId required | Enables modules for a tenant | High |
| TenantSetting | Tenant-scoped | tenantId required | Stores tenant-scoped configuration values | High |
| AuditLog | Mixed/system/event | tenantId nullable only for system/platform events | Append-only security and activity history | High |
| Session | Global/auth | no tenantId | DB-backed auth session store | High |

## 5. Proposed Model Field Plan

### Tenant

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | referenced by memberships/settings/module access/logs | stable identifier only |
| slug | string | required | unique | human-readable workspace key | should be immutable after creation if possible |
| name | string | required | indexed if needed | display name for workspace | not secret |
| legalName | string | optional | none | optional billing/legal label | not secret |
| status | enum/string | required | indexed | lifecycle state | avoid overloading with access logic |
| isActive | boolean | required | indexed | convenience flag | should not replace status entirely |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | use carefully for restore rules |

### User

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | referenced by memberships and actor fields | global identity only |
| email | string | required | unique | login/identity lookup later | sensitive; do not expose casually |
| displayName | string | optional | none | profile display | not secret |
| status | enum/string | required | indexed | lifecycle state | useful for deactivate/lock |
| isActive | boolean | required | indexed | convenience flag | do not use alone for access decisions |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | future restore rules |

### Session

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | session identifier | opaque browser session handle |
| userId | string | required | indexed | belongs to User | revokes with user deactivation |
| sessionTokenHash | string | required | unique | hashed browser token | never store plaintext token |
| createdAt | datetime | required | indexable | timestamps | standard |
| expiresAt | datetime | required | indexed | session expiration | required for revocation window |
| revokedAt | datetime nullable | optional | indexed | revocation marker | logout/admin reset/user deactivation |
| lastSeenAt | datetime nullable | optional | indexed | activity marker | optional but useful |
| ipAddress | string nullable | optional | none | request origin | useful for audit review |
| userAgent | string nullable | optional | none | client context | useful for security review |

### TenantMembership

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | membership identifier | canonical tenant access boundary |
| tenantId | string | required | indexed | belongs to Tenant | must always be present |
| userId | string | required | indexed | belongs to User | links global identity to workspace |
| status | enum/string | required | indexed | membership lifecycle | use for invite/active/disabled |
| title | string | optional | none | job title or label | not access-sensitive |
| invitedByUserId | string | optional | indexed if used | future audit trail | access events should be audited |
| acceptedAt | datetime | optional | none | invitation acceptance marker | useful for invite workflows |
| joinedAt | datetime | optional | indexed | membership start date | useful for lifecycle |
| leftAt | datetime | optional | indexed | membership end date | useful for offboarding |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | use carefully |

### Role

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | referenced by assignments and permissions | access template |
| tenantId | string nullable | required for tenant roles | unique with key when tenant-scoped | belongs to Tenant when tenant-scoped | global/system role model deferred unless explicitly approved later |
| key | string | required | unique per tenant when tenant-scoped | stable role key | human-readable and stable |
| name | string | required | indexed | display label | not secret |
| description | string | optional | none | explanatory text | not secret |
| scope | enum/string | required | indexed | tenant or system scope | keeps scope explicit |
| isSystem | boolean | required | indexed | marks internal template role | should be rare |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | protect system roles |

### Permission

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | referenced by role grants | global catalog entry |
| key | string | required | unique | stable permission key | `module:action` or `domain:action` |
| name | string | required | indexed | display label | not secret |
| description | string | optional | none | explanatory text | not secret |
| moduleKey | string | optional | indexed | links to module conceptually | DB-1 stays global/system-defined |
| scope | enum/string | required | indexed | global/system scope | simple and stable |
| isSystem | boolean | required | indexed | indicates platform permission | rare change surface |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | protect catalog integrity |

### RolePermission

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | join record | simple join model |
| tenantId | string | required for tenant-scoped roles | indexed | mirrors role scope | tenant-scoped grants should be tenant-aware |
| roleId | string | required | indexed | belongs to Role | grant target |
| permissionId | string | required | indexed | belongs to Permission | granted permission |
| createdAt | datetime | required | indexable | timestamps | audit-worthy |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | rarely needed |

### MembershipRole

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | join record | tenant-access grant path |
| tenantId | string | required | indexed | belongs to tenant via membership | must be explicit |
| tenantMembershipId | string | required | indexed | belongs to TenantMembership | canonical role assignment boundary |
| roleId | string | required | indexed | belongs to Role | grants access template |
| assignedByUserId | string | optional | indexed if used | future audit trail | should be audited |
| assignedAt | datetime | optional | indexed | grant timestamp | useful for history |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | use carefully |

### ModuleDefinition

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | referenced by module enablement and permissions | global catalog |
| key | string | required | unique | stable module key | human-readable, stable |
| name | string | required | indexed | display label | not secret |
| description | string | optional | none | explanatory text | not secret |
| version | string | optional | indexed | module version metadata | useful for rollout planning |
| status | enum/string | required | indexed | planned/active/deprecated | keep lifecycle simple |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | rare changes only |

### TenantModule

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | tenant enablement record | tenant-scoped module access |
| tenantId | string | required | unique with moduleDefinitionId | belongs to Tenant | mandatory tenant isolation |
| moduleDefinitionId | string | required | unique with tenantId | belongs to ModuleDefinition | module enablement target |
| status | enum/string | required | indexed | enabled/disabled/blocked | controls availability |
| enabledAt | datetime | optional | indexed | activation timestamp | useful for rollout history |
| disabledAt | datetime | optional | indexed | disable timestamp | useful for audits |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | avoid hard deletes if possible |

### TenantSetting

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | tenant-scoped settings | normal configuration only |
| tenantId | string | required | indexed | belongs to Tenant | mandatory scope |
| key | string | required | unique with tenantId | setting key | stable, human-readable |
| valueType | enum/string | required | indexed | text/json/boolean/number/etc. | keep typing explicit |
| value | string/json/number/boolean | required | none | setting payload | must not contain plaintext secrets |
| moduleKey | string | optional | indexed | if module-scoped | optional grouping |
| createdAt | datetime | required | indexable | timestamps | standard |
| updatedAt | datetime | required | indexable | timestamps | standard |
| deletedAt | datetime nullable | optional | indexed | soft delete marker | use carefully |

### AuditLog

| Field | Type recommendation | Required/optional | Uniqueness/indexing | Relation notes | Security notes |
|---|---|---|---|---|---|
| id | string ID | required | primary key | log record | append-only source of truth |
| tenantId | string nullable | optional | indexed | tenant-scoped when applicable | nullable only for system/platform events |
| actorType | enum/string | required | indexed | user/system/automation/api | must exist in DB-1 |
| actorUserId | string nullable | optional | indexed | links to User when actor is a user | nullable for non-user actors |
| action | string | required | indexed | event action key | stable and searchable |
| entityType | string | required | indexed | affected entity type | useful for audit queries |
| entityId | string nullable | optional | indexed | affected record id | nullable for broad events |
| metadata | json | optional | none | structured event details | avoid secrets in metadata |
| ipAddress | string nullable | optional | indexed if needed | request origin | useful for security review |
| userAgent | string nullable | optional | none | client context | useful for investigations |
| createdAt | datetime | required | indexed | event time | immutable record timestamp |

## 6. ID and Naming Strategy

- ID type recommendation: string IDs compatible with cuid/uuid strategy
- model names: singular PascalCase
- table mapping strategy: use Prisma defaults unless a later naming review requires explicit table mapping
- enum naming strategy: clear PascalCase names with a small number of stable values
- key/slug conventions: lowercase, stable, human-readable, unique where required
- timestamp conventions: `createdAt`, `updatedAt`, optional `deletedAt`
- relation naming: explicit only when needed for clarity
- index naming guidance: keep it simple and let Prisma/PostgreSQL manage default names unless a specific index needs a reviewed name

## 7. Tenant Isolation Rules for Schema

- every tenant-scoped model must have `tenantId` unless explicitly parent-bound and approved
- unique constraints must include `tenantId` for tenant-owned names/keys
- role assignment must go through `TenantMembership`
- no `UserRole` for tenant access
- relation includes must not become cross-tenant leaks
- future service layer must derive tenant from auth context
- protected API must not accept tenantId from body

## 8. RBAC Schema Plan

- `Role` is tenant-aware in DB-1
- `Permission` is a global catalog in DB-1
- `RolePermission` links roles to permissions
- `MembershipRole` links roles to tenant memberships
- default roles concept:
  - owner
  - admin
  - member
  - viewer
- internal DCA roles should stay membership-bounded unless a separate audited system-admin model is later approved
- client portal roles should be constrained to least privilege
- global system-admin remains deferred because it creates a separate trust boundary that should not be introduced before the auth and security model is explicit

Recommended permission key pattern:

- `module:action`

Examples:

- `settings:read`
- `settings:update`
- `users:read`
- `users:invite`
- `roles:manage`
- `modules:manage`
- `audit:read`

## 9. Settings Schema Plan

- `TenantSetting` is the DB-1 settings model
- platform/user settings can be introduced later if the product needs them, but they are not required for DB-1
- setting key/value typing should be explicit and simple
- public/non-secret values only belong in normal settings rows
- future encrypted secret storage must be separate from normal settings

## 10. Module Enablement Schema Plan

- `ModuleDefinition` is the global catalog
- `TenantModule` enables modules per tenant
- module keys should be stable and human-readable
- module status should stay simple: planned, active, deprecated, retired or a similar small set
- feature flags are distinct from module enablement and should not be merged into the same concept
- future module lifecycle integration should occur through module definitions and tenant enablement rather than ad hoc booleans scattered across tables

## 11. AuditLog Schema Plan

- use one append-only `AuditLog` table
- `actorType` is required
- `actorUserId` is nullable for system events
- `tenantId` is nullable only for platform/system events
- `action` is required and should be stable
- `entityType` is required
- `entityId` is nullable
- `metadata` should be JSON
- `ipAddress` and `userAgent` are nullable
- `createdAt` is required
- audit writes are immutable in normal app behavior
- retention policy should be decided later
- audit reads are tenant-scoped except for platform security views

## 12. Enum / Status Plan

Recommended enums or string constants:

- tenant status: `active`, `inactive`, `archived`, `deleted`
- membership status: `invited`, `active`, `suspended`, `removed`
- role scope/type: `tenant`, `system`
- module status: `planned`, `active`, `deprecated`, `retired`
- setting value type: `string`, `number`, `boolean`, `json`, `date`
- actor type: `user`, `system`, `automation`, `api`

Keep it simple and avoid over-engineering business-specific enums too early.

## 13. Index and Constraint Plan

Required unique constraints and indexes:

- User email unique
- Tenant slug unique
- TenantMembership unique `tenantId + userId`
- Role unique `tenantId + key` if tenant-scoped
- Permission key unique
- RolePermission unique `roleId + permissionId`
- MembershipRole unique `tenantMembershipId + roleId`
- ModuleDefinition key unique
- TenantModule unique `tenantId + moduleDefinitionId`
- TenantSetting unique `tenantId + key`, or `tenantId + moduleKey + key` if module-scoped
- AuditLog indexes on `tenantId`, `actorUserId`, `entityType/entityId`, `action`, `createdAt`

## 14. Delete / Archive / Lifecycle Policy

- hard delete should be avoided for important entities
- soft delete or status should be supported for Tenant, User, Membership, Role, TenantModule
- AuditLog should never be soft-deleted in normal application behavior
- Permission and ModuleDefinition changes should be controlled and reviewed
- cascade deletes should be used cautiously and only where ownership is obvious

## 15. Prisma Implementation Sequence Later

Future implementation should proceed in small steps:

1. update `schema.prisma` with DB-1 models only
2. run `prisma validate`
3. run package checks
4. do not migrate yet
5. review the generated diff
6. approve local migration separately
7. approve local dev DB separately

## 16. DB-1 Schema Review Checklist

- `TenantMembership` is used, not `TenantUser`
- no `UserRole` for tenant roles
- tenantId rules are applied
- indexes and unique constraints are correct
- `AuditLog.actorType` is included
- no auth/session/password models unless Auth Gate is approved
- no module business tables are included too early
- `prisma validate` passes
- no migration is run

## 17. Open Questions

Open questions before implementation:

- should `Role` allow a future explicit system scope in DB-1, or stay tenant-only for the first schema pass?
- should `TenantSetting` remain the only DB-1 settings table, with platform/user settings deferred?
- should `AuditLog` remain the single canonical event table, or should a read-only activity projection be added later?
- should local PostgreSQL setup be approved before schema implementation or deferred until after DB-1 approval?

## 18. Recommended Next Step

Safest next task after human review:

**DB-1 schema implementation without migration**

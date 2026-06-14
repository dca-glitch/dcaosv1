# Authorization Matrix

Expected responses:

- Unauthenticated protected routes should return `401 AUTH_UNAUTHORIZED`.
- Authenticated but insufficient access should return `403 AUTH_FORBIDDEN` or a route-specific generic forbidden response.
- Missing resources should return a standardized `404`.

| Method | Path | Auth required | Tenant required | Role/permission required | Current implementation status | Expected unauthenticated | Expected unauthorized | Smoke coverage | Recommended additional tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | No | No | None | Public health endpoint | 200 | N/A | Yes | Monitor from staging proxy. |
| GET | `/api/v1/auth/status` | No | No | None | Public skeleton status | 200/501 skeleton shape | N/A | No | Verify no sensitive config leaks. |
| POST | `/api/v1/auth/start` | No | No | None | Public skeleton start | 501 skeleton | N/A | No | Confirm no OAuth redirect until approved. |
| GET | `/api/v1/auth/callback` | No | No | None | Public skeleton callback | 501 skeleton | N/A | No | Confirm no provider secrets. |
| POST | `/api/v1/auth/login` | No | No | None | Public controlled MVP login | 200 or 401 generic | N/A | Yes | Lockout/rate-limit tests. |
| POST | `/api/v1/auth/logout` | Yes | No | None | Protected session revoke | 401 `AUTH_UNAUTHORIZED` | N/A | Yes | Reused-token denial. |
| GET | `/api/v1/auth/me` | Yes | No | None | Protected current user/session summary | 401 `AUTH_UNAUTHORIZED` | N/A | Yes | Verify no password/session hash fields. |
| GET | `/api/v1/auth/context` | Yes | Yes | `owner` role | Protected owner auth context | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes for owner | Add tester forbidden smoke. |
| GET | `/api/v1/auth/context/local-tester` | Yes | Yes | `local_tester` role | Test-only context route for local tester | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | No | Review whether route should remain before staging. |
| POST | `/api/v1/auth/change-password` | No | No | None | Skeleton only | 501 skeleton | N/A | No | Ensure not exposed as real reset/change flow. |
| GET | `/api/v1/tenants` | Yes | No | None | Lists authenticated user's active memberships | 401 `AUTH_UNAUTHORIZED` | N/A | No | Add smoke coverage. |
| GET | `/api/v1/tenants/current` | Yes | Yes | None | Active tenant from session context | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes | Cross-tenant membership tests. |
| POST | `/api/v1/tenants/current/switch` | Yes | Valid membership owned by user | None | Switches session active membership | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | No | Invalid membership and cross-tenant tests. |
| GET | `/api/v1/tenants/current/members` | Yes | Yes | `users:read` | Read-only tenant members | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes | Cross-tenant member ID negative tests. |
| GET | `/api/v1/tenants/current/members/:membershipId` | Yes | Yes | `users:read` | Read-only tenant member detail | 401 `AUTH_UNAUTHORIZED` | 403 or 404 | No | Cross-tenant ID returns 404/no leakage. |
| GET | `/api/v1/tenants/current/settings` | Yes | Yes | `settings:read` | Read-only tenant settings summary | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes | Cross-tenant negative tests. |
| PATCH | `/api/v1/tenants/current/settings` | Yes | Yes | `settings:update` | Minimal safe tenant name update exists | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | No | Validate length, authz, audit logging. |
| GET | `/api/v1/modules` | No | No | None | Public module catalog | 200 | N/A | Yes | Confirm catalog has no tenant data. |
| GET | `/api/v1/modules/:key` | No | No | None | Public module detail | 200 or 404 | N/A | No | Invalid key standardized 404. |
| GET | `/api/v1/modules/current` | Yes | Yes | None | Current tenant module enablement | 401 `AUTH_UNAUTHORIZED` | 403 generic tenant failure | Yes | Tenant isolation tests. |
| POST | `/api/v1/modules/current/:moduleKey/enable` | Yes | Yes | `modules:manage` | Owner/admin module enable | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes | Invalid module and tester forbidden. |
| POST | `/api/v1/modules/current/:moduleKey/disable` | Yes | Yes | `modules:manage` | Owner/admin module disable | 401 `AUTH_UNAUTHORIZED` | 403 `AUTH_FORBIDDEN` | Yes | Invalid module and tester forbidden. |

## Highlights

- Intentionally unauthenticated routes: health, login, module catalog, module detail, auth skeleton status/start/callback.
- Protected routes: logout, auth/me, auth/context, tenants, current tenant routes, current module routes.
- Routes needing extra negative tests: tenant switch, member detail, settings update, auth/context tester access, module detail invalid keys.
- Routes needing external auditor review: all auth/session routes, tenant-scoped routes, module mutation routes, and any skeleton route that remains public before staging.

# DCA OS v1 MVP Readiness

## Current MVP Capabilities

- Controlled local login and logout.
- Authenticated session context with active tenant membership.
- Tenant membership listing and current tenant switch.
- Global module catalog and current tenant module enablement state.
- Owner/admin module enable and disable actions.
- Read-only Team member list for authorized tenant users.
- Read-only Settings summary for authorized tenant users.

## Route Guard Matrix

| Route | Auth | Tenant | Role/Permission | Status |
| --- | --- | --- | --- | --- |
| `GET /api/v1/health` | No | No | No | Public health check. |
| `POST /api/v1/auth/login` | No | No | No | Public controlled MVP login. |
| `POST /api/v1/auth/logout` | Yes | No | No | Revokes current session. |
| `GET /api/v1/auth/me` | Yes | No | No | Returns safe user/session summary. |
| `GET /api/v1/auth/context` | Yes | Yes | `owner` role | Returns safe authorization context for owner/admin MVP flow. |
| `GET /api/v1/tenants` | Yes | No | No | Lists authenticated user's active memberships. |
| `GET /api/v1/tenants/current` | Yes | Yes | No | Returns server-selected active tenant context. |
| `POST /api/v1/tenants/current/switch` | Yes | Valid membership | No | Switches only to an active membership owned by the session user. |
| `GET /api/v1/tenants/current/members` | Yes | Yes | `users:read` | Read-only Team list. |
| `GET /api/v1/tenants/current/settings` | Yes | Yes | `settings:read` | Read-only tenant settings summary. |
| `GET /api/v1/modules` | No | No | No | Public module catalog. |
| `GET /api/v1/modules/current` | Yes | Yes | No | Current tenant module enablement. |
| `POST /api/v1/modules/current/:moduleKey/enable` | Yes | Yes | `modules:manage` | Owner/admin module enable action. |
| `POST /api/v1/modules/current/:moduleKey/disable` | Yes | Yes | `modules:manage` | Owner/admin module disable action. |
| `GET /api/v1/clients/:id/users` | Yes | Yes | `owner` or `admin` role | Lists active client-level access mappings for a tenant-scoped client. |
| `POST /api/v1/clients/:id/users` | Yes | Yes | `owner` or `admin` role | Grants an active tenant user client-level Client Portal access. |
| `POST /api/v1/clients/:id/users/:userId/archive` | Yes | Yes | `owner` or `admin` role | Revokes client-level Client Portal access by archiving the mapping. |

## Frontend Pages

- Dashboard: user, tenant, roles, and permission count.
- Tenants: available memberships and current session tenant switch.
- Modules: catalog, current tenant enablement, admin actions, and safe module placeholders.
- Team: read-only current tenant members when allowed.
- Settings: read-only profile and tenant settings summary when allowed.

## Smoke

Run only against the local API and local development database:

```powershell
$env:AUTH_SEED_TEST_EMAIL="<local-test-email>"
$env:AUTH_SEED_TEST_PASSWORD="<local-test-password>"
npm.cmd run smoke:mvp:local
```

Optional tester credentials can verify forbidden module actions:

```powershell
$env:AUTH_SEED_TESTER_EMAIL="<local-tester-email>"
$env:AUTH_SEED_TESTER_PASSWORD="<local-tester-password>"
npm.cmd run smoke:mvp:local
```

The smoke command prints pass/fail summaries only and must not print passwords, tokens, cookies, auth headers, password hashes, or session token hashes.

The local smoke command intentionally refuses non-local API hosts. Add a separate reviewed staging smoke command before running smoke against a VPS.

## Deployment Readiness Notes

- `npm.cmd run validate` is the current full local/CI validation command.
- `npm.cmd run -w @dca-os-v1/web build` creates the frontend build output.
- `npm.cmd run -w @dca-os-v1/api build` currently type-checks the API; it does not emit production JavaScript.
- `npm.cmd run -w @dca-os-v1/api dev` starts the API through `tsx` and is suitable for local validation only.
- API security headers/CSP baseline and in-memory MVP rate limiting are now present.
- Market Intelligence auth token reads now use sessionStorage consistently.
- Market Intelligence admin MVP closure is documented in `docs/ai-market-intelligence/admin-foundation.md`.
- Monthly Report Phase 1 schema-free monthly summary API is documented in `docs/ai-delivery-api-contract.md` and smoke-validated with `npm.cmd run smoke:monthly-report:local`.
- Monthly Report Phase 2 persisted `AiDeliveryMonthlyReport` model and admin CRUD API are implemented, migration applied, and smoke-validated (58 PASS with document handoff coverage). Monthly metrics are now closed as an admin-only snapshot-first foundation plus admin UI; live Google OAuth/provider sync, CSV upload, and client portal metrics exposure remain deferred.
- Monthly Report Admin UI is implemented and browser-proven with `npm.cmd run smoke:monthly-report:browser`.
- Client Portal monthly reports are implemented and browser-proven with `npm.cmd run smoke:client-portal-monthly-report:browser`.
- Client Access Admin UI foundation is closed for MVP at client-level scope and smoke-proven with `npm.cmd run smoke:client-access:local`. The Client Portal remains read-only and restricted to final client-safe data; client review/actions/comments/public links remain deferred.
- The first-client onboarding runbook is available in `docs/ai-delivery/client-onboarding-runbook.md` for controlled local/admin MVP work.
- Monthly Report document handoff is implemented and local-smoke-proven with `npm.cmd run smoke:monthly-report:local`.
- Backup/restore and staging migration runbooks are documented.
- Finance smoke proves tenantId spoof handling locally and skips full cross-tenant proof without a real second tenant.
- AI Delivery readiness closure and smoke index are documented in `docs/ai-delivery/client-delivery-readiness.md`.
- A production start strategy is still required before VPS deployment.
- Same-origin reverse proxy routing is preferred so the frontend can use `/api/v1`.
- No CORS environment contract is implemented yet.
- See `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md` before any staging deployment.
- See `docs/audit/README.md` for the external audit preparation pack before VPS staging or client access.

## Out Of Scope

- OAuth.
- Invite flow.
- Password reset.
- Billing.
- Marketplace.
- Legacy finance migration.
- VPS deployment.
- Production database use.
- Role editing UI.
- Destructive user or tenant actions.
- Project-specific client access grants; the current `ClientUserAccess` model is tenant/client/user scoped only.
- Client approvals, comments, request-changes actions, and public approval links.

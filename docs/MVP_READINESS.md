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
- A production start strategy is still required before VPS deployment.
- Same-origin reverse proxy routing is preferred so the frontend can use `/api/v1`.
- No CORS environment contract is implemented yet.
- See `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md` before any staging deployment.

## Out Of Scope

- OAuth.
- Invite flow.
- Password reset.
- Billing.
- Marketplace.
- Finance Lite migration.
- VPS deployment.
- Production database use.
- Role editing UI.
- Destructive user or tenant actions.

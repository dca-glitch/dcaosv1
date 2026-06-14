# Tenant Isolation Test Plan

## Assumptions

- The system is multi-tenant by `Tenant`, `TenantMembership`, active session membership, and tenant-scoped queries.
- Current tenant context is server-derived from the session, not from arbitrary body/query/header tenant IDs.
- Local seed currently creates a local tenant/test user; additional multi-tenant fixtures are needed for full isolation testing.

## Required Seed Data

- Tenant A with owner/admin user.
- Tenant A with non-admin user.
- Tenant B with separate user.
- Cross-tenant tester with no membership in Tenant B.
- Distinct members, settings, and module enablement records per tenant.

## Test Users

- Owner/admin tenant A.
- Non-admin tenant A.
- User tenant B.
- Cross-tenant tester.

## Tests

| Test | Steps | Expected HTTP codes | Data leakage checks |
| --- | --- | --- | --- |
| Cannot access Tenant B members from Tenant A | Login Tenant A user; attempt member detail using Tenant B membership ID | 404 or 403 | Response must not reveal Tenant B name, user email, or ID validity. |
| Cannot switch to tenant without membership | Login Tenant A user; POST Tenant B membership ID to `/tenants/current/switch` | 403 | Generic forbidden only. |
| Cannot enable modules for unauthorized tenant | Login non-admin Tenant A user; call module enable | 403 | No module state mutation. |
| Cannot read settings for unauthorized tenant | Login non-admin without `settings:read`; call settings | 403 | No tenant settings fields. |
| Cannot infer tenant data through errors | Use random and valid cross-tenant IDs | 403/404 generic | No existence oracle beyond allowed route behavior. |
| Session context updates after tenant switch | Login multi-tenant user; switch membership; call `/auth/me`, `/auth/context`, `/tenants/current`, `/modules/current` | 200 | Active tenant and roles update consistently. |
| Reused token denied after logout | Login, logout, reuse token on protected routes | 401 | No stale session access. |
| Tenant module state isolated | Enable module in Tenant A; switch/login Tenant B; list modules/current | 200 | Tenant B does not inherit Tenant A enablement. |
| Member list scoped | Login Tenant A owner; list members | 200 | Only Tenant A members returned. |
| Settings update scoped | If settings update remains enabled, update Tenant A name | 200/403 depending role | Tenant B unchanged; audit should record actor later. |

## Recommended Automation Plan

1. Add a dedicated multi-tenant local/staging fixture script that refuses production hosts.
2. Add smoke script mode for tenant isolation negative tests.
3. Keep credentials in environment variables only.
4. Print pass/fail only, never tokens, passwords, hashes, cookies, or headers.
5. Run locally before staging and again in staging with staging-only data.

## Blockers Before Client Access

- Cross-tenant negative tests must pass.
- External auditor must review tenant-scoped queries and route matrix.
- Error responses must be checked for tenant existence leakage.
- Admin/module/settings actions should have audit logging.

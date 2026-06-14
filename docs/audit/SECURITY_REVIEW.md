# Security Review

This review uses OWASP ASVS 5.0.0, OWASP Top 10 2025 awareness, OWASP Authentication guidance, OWASP Session Management guidance, and practical SaaS multi-tenant review as reference frames. It is not a certification.

## 1. Executive Summary

- Implemented controls: local MVP auth/session, tenant context, permission guards, Prisma schema, local smoke, CI validation.
- Evidence in repo: `apps/api/src/auth`, `apps/api/src/middlewares`, `packages/data/prisma/schema.prisma`, `scripts/smoke-mvp-local.mjs`, `.github/workflows/ci.yml`.
- Gaps: no VPS deployment, staging smoke command is prepared but not executed, no staging/client browser QA evidence attached to this audit pack, no external tenant isolation review.
- Recommended solution: complete staging dry run, negative tests, external review, and operations checklist.
- Staging requirement: HTTPS, reverse proxy, staging DB, env separation, migration dry run.
- Client-access requirement: external security review complete and high risks remediated.

## 2. Current Trust Boundaries

- Implemented controls: API routes are versioned under `/api/v1`; tenant-aware routes use server-derived session context.
- Evidence in repo: `apps/api/src/app.ts`, `apps/api/src/routes/v1.ts`, `apps/api/src/middlewares/tenant.middleware.ts`.
- Gaps: reverse proxy boundary and browser origin policy are not deployed.
- Recommended solution: define same-origin proxy and CORS allowlist only if needed.
- Staging requirement: verify public URL, TLS, and proxy routing.
- Client-access requirement: document and test all trust boundaries.

## 3. Authentication Review

- Implemented controls: controlled MVP login, generic login failure, scrypt password verification, no password trimming before verification, failed login counters and lockout fields.
- Evidence in repo: `apps/api/src/auth/login.runtime.ts`, `apps/api/src/auth/password.service.ts`, `packages/data/prisma/schema.prisma`.
- Gaps: no password reset, invite flow, OAuth, MFA, or full rate limiting.
- Recommended solution: add recovery/onboarding design before client access; add app/proxy rate limit.
- Staging requirement: verify lockout behavior and generic failures.
- Client-access requirement: approve password reset/admin recovery and onboarding flow.

## 4. Session Management Review

- Implemented controls: generated session tokens, DB stores `sessionTokenHash`, expiry, revocation, active tenant membership on session.
- Evidence in repo: `apps/api/src/auth/session.service.ts`, `apps/api/src/auth/session-context.runtime.ts`, `Session` model.
- Gaps: frontend currently stores raw token in `sessionStorage`; cookie flags are not exercised; CSRF posture depends on future transport.
- Recommended solution: reassess token storage before client access; if cookies are used, verify Secure, HttpOnly, SameSite, CSRF controls, and HTTPS-only delivery.
- Staging requirement: verify HTTPS and session behavior behind proxy.
- Client-access requirement: no token in localStorage unless explicitly justified; prefer secure HttpOnly cookies if feasible.

## 5. Authorization / RBAC Review

- Implemented controls: `requireAuth`, `requireTenant`, `requirePermission`, `requireRole`; owner/admin map to core permissions; local tester has no permissions.
- Evidence in repo: `apps/api/src/middlewares/authorization.middleware.ts`, `apps/api/src/routes/tenants.ts`, `apps/api/src/routes/modules.ts`.
- Gaps: MVP role map is hardcoded; formal external authorization matrix review pending.
- Recommended solution: add route-level negative tests and external review before client access.
- Staging requirement: smoke authorized and forbidden paths.
- Client-access requirement: complete authorization matrix verification.

## 6. Tenant Isolation Review

- Implemented controls: current tenant routes derive tenant from active session membership; tenant switch validates membership belongs to authenticated user.
- Evidence in repo: `apps/api/src/tenants/tenant.runtime.ts`, `apps/api/src/auth/session-context.runtime.ts`.
- Gaps: cross-tenant negative tests are not automated.
- Recommended solution: execute `TENANT_ISOLATION_TEST_PLAN.md`.
- Staging requirement: create multi-tenant fixture and verify negative cases.
- Client-access requirement: auditor sign-off on tenant isolation.

## 7. API Security Review

- Implemented controls: standardized responses, generic auth errors, protected current tenant/module routes.
- Evidence in repo: `apps/api/src/utils/responses.ts`, controllers and routes.
- Gaps: no request rate limit, body size policy beyond Express defaults, CORS allowlist, or security headers.
- Recommended solution: add proxy/app limits, CORS allowlist if cross-origin, and API negative tests.
- Staging requirement: verify unauthorized vs forbidden behavior.
- Client-access requirement: complete API security tests.

## 8. Frontend Security Review

- Implemented controls: frontend hides/disables admin module actions for non-admin contexts, clears session on unauthorized responses, avoids printing secrets.
- Evidence in repo: `apps/web/src/App.tsx`.
- Gaps: local browser QA passed in prior gates, but staging/client browser QA evidence is not attached to this audit pack; token in `sessionStorage`; CSP not verified.
- Recommended solution: manual browser QA, CSP/security headers, token transport review.
- Staging requirement: verify UI on HTTPS staging.
- Client-access requirement: browser QA screenshots and session storage decision.

## 9. Secrets And Environment Review

- Implemented controls: `.env.example` uses placeholders; docs forbid committing secrets; local smoke requires env vars.
- Evidence in repo: `.env.example`, `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md`.
- Gaps: VPS secret storage/process not validated.
- Recommended solution: separate local/staging/prod envs; no secrets in Git; host-level secret handling review.
- Staging requirement: verify staging env without printing values.
- Client-access requirement: approved secrets rotation and access policy.

## 10. Database And Prisma/Data-Layer Review

- Implemented controls: Prisma schema, migrations, no production db push policy, local seed refuses non-local DB target.
- Evidence in repo: `packages/data/prisma/schema.prisma`, migrations, `packages/data/scripts/seed-db1.mjs`.
- Gaps: least-privilege staging/prod DB roles not verified; migration dry run not completed.
- Recommended solution: staging DB user least privilege and migration runbook.
- Staging requirement: migration only via approved step; no `prisma db push`.
- Client-access requirement: backup/restore and rollback tested.

## 11. Deployment And Infrastructure Security Review

- Implemented controls: staging deployment plan exists; no deployment performed.
- Evidence in repo: `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md`.
- Gaps: TLS, HSTS, reverse proxy, security headers, monitoring, and start strategy not implemented.
- Recommended solution: define supervised production API start and proxy config.
- Staging requirement: HTTPS-only, HSTS after domain confirmation, security headers/CSP.
- Client-access requirement: monitoring and rollback runbooks complete.

## 12. Logging/Audit Trail Review

- Implemented controls: `AuditLog` schema exists.
- Evidence in repo: `packages/data/prisma/schema.prisma`.
- Gaps: admin/security audit writes may be incomplete.
- Recommended solution: add audit logging for login, logout, tenant switch, module mutation, settings changes, and admin actions.
- Staging requirement: verify no secrets in logs.
- Client-access requirement: audit logging reviewed and retention policy set.

## 13. Error Handling/Data Leakage Review

- Implemented controls: generic login failures, response helpers, no password/session hash in normal responses.
- Evidence in repo: `apps/api/src/utils/responses.ts`, `scripts/smoke-mvp-local.mjs`.
- Gaps: fuzz/negative tests are not comprehensive.
- Recommended solution: add tests for 401, 403, 404, invalid params, and cross-tenant attempts.
- Staging requirement: verify logs and responses do not leak secrets.
- Client-access requirement: external negative testing complete.

## 14. Dependency And Supply Chain Review

- Implemented controls: `npm ci` in CI and Dependabot config.
- Evidence in repo: `.github/workflows/ci.yml`, `.github/dependabot.yml`.
- Gaps: no documented dependency audit workflow or vulnerability acceptance process.
- Recommended solution: add scheduled dependency review and `npm audit` or equivalent policy.
- Staging requirement: review dependency status before deployment.
- Client-access requirement: vulnerability review complete.

## 15. Backup/Restore And Business Continuity Review

- Implemented controls: backup is required in deployment plan.
- Evidence in repo: `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md`.
- Gaps: no backup/restore drill evidence.
- Recommended solution: run restore drill before production/client access.
- Staging requirement: snapshot before migration.
- Client-access requirement: backup/restore tested and documented.

## 16. Privacy/Data Minimization Notes

- Implemented controls: current MVP returns limited user, tenant, role, and module summaries.
- Evidence in repo: controllers select limited fields; frontend read-only pages.
- Gaps: no privacy retention policy or client data classification.
- Recommended solution: define data retention, audit log retention, and minimal data collection rules.
- Staging requirement: no production/client data in staging.
- Client-access requirement: privacy/data retention notes approved.

## 17. Current Known Gaps

- No VPS deployment.
- Staging smoke command exists but has not been run against VPS staging.
- No real browser QA sign-off.
- No password reset, invite flow, OAuth, billing, marketplace, or Finance Lite migration.
- No production start strategy.
- No CORS/security header verification.
- No tenant isolation negative test evidence.
- No backup/restore test.
- No monitoring/incident runbook.

## 18. Recommended Remediation Roadmap

- Must fix before VPS staging: staging env contract, VPS process supervisor/restart policy, staging DB safety, migration runbook, HTTPS/proxy plan, and staging smoke execution plan.
- Must fix before client access: tenant isolation negative tests, external auth/session review, staging/client browser QA evidence, backup/restore test, admin audit logging, security headers/CSP, dependency review.
- Should fix before beta: onboarding, password reset/admin recovery, monitoring, incident response, privacy retention.
- Future hardening: SSO/OAuth if required, MFA, deeper module isolation, automated security tests.

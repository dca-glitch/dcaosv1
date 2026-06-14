# Risk Register

Status meanings:

- Implemented: repo contains working control.
- Partial: local MVP control exists but needs staging, automation, or external review.
- Not verified: control may be handled by future VPS/proxy/operations setup, but no evidence exists yet.
- Missing: not implemented yet.
- Documented: planned or documented only.

## Critical

| Risk ID | Title | Area | Current status | Evidence / current control | Gap | Impact | Likelihood | Recommended remediation | Owner | Priority | VPS blocker | Client blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | VPS/staging deployment not validated | Deployment | Documented | `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md` | No staging run, no staging logs | Deployment can fail or expose unsafe config | High | Execute approved staging dry run with smoke and rollback plan | Engineering | P0 | Yes | Yes |
| R-002 | Tenant isolation not externally verified | Multi-tenant | Partial | Tenant-scoped Prisma queries and auth context | No full cross-tenant negative test suite | Cross-client data exposure | Medium | Run tenant isolation plan with multi-tenant fixtures | Engineering + Auditor | P0 | No | Yes |
| R-003 | Secrets management on VPS not validated | Secrets | Documented | `.env.example` placeholder rules | No VPS secret store/process verified | Credential leak or wrong DB target | Medium | Define staging/prod secret handling and review host config | Engineering/Ops | P0 | Yes | Yes |
| R-004 | Backup/restore not tested | Continuity | Missing | Plan mentions backup before migration | No restore drill evidence | Data loss or extended outage | Medium | Create backup/restore runbook and perform staging drill | Ops | P0 | Yes | Yes |

## High

| Risk ID | Title | Area | Current status | Evidence / current control | Gap | Impact | Likelihood | Recommended remediation | Owner | Priority | VPS blocker | Client blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-005 | Staging smoke path not executed | QA | Partial | `npm.cmd run smoke:mvp:staging` exists and refuses unapproved hosts | No staging host run or evidence yet | Staging regressions missed | High | Execute reviewed staging smoke after VPS staging is approved | Engineering | P1 | Yes | Yes |
| R-006 | Staging/client browser QA evidence not collected | Frontend | Partial | Local browser QA/dev-server smoke was completed in prior gate | No VPS/client-browser screenshots or repeatable evidence attached to audit pack | UI/session bugs missed after deployment | Medium | Run staging browser QA checklist with screenshots | QA | P1 | Yes | Yes |
| R-007 | Password reset not implemented | Auth | Missing | Out-of-scope docs | No recovery flow | Users can be locked out | High after clients | Decide admin reset vs password reset design | Product/Engineering | P1 | No | Yes |
| R-008 | Invite/onboarding flow not implemented | Auth | Missing | Out-of-scope docs | No safe client onboarding | Manual user creation risk | High after clients | Design invite/onboarding flow with email security | Product/Engineering | P1 | No | Yes |
| R-009 | OAuth/SSO not implemented if required | Auth | Missing | Auth provider skeleton only | No SSO path | Enterprise access blocked | Medium | Confirm SSO requirement; implement only if needed | Product | P2 | No | Conditional |
| R-010 | MVP role/permission model needs formal verification | Authorization | Partial | `authorization.middleware.ts`, route guards | No external matrix sign-off | Privilege bypass | Medium | Review matrix and add negative tests | Auditor/Engineering | P1 | No | Yes |
| R-011 | Session cookie/security properties not verified | Session | Partial | Bearer token MVP, session helpers exist | HTTPS cookie flags not exercised | Session theft/CSRF risk | Medium | Decide cookie vs bearer strategy; verify Secure, HttpOnly, SameSite in HTTPS staging | Engineering/Security | P1 | Yes | Yes |
| R-012 | CORS/origin not implemented for cross-origin | API | Documented | Same-origin proxy recommended | No CORS allowlist if split origins | Cross-origin exposure or broken app | Medium | Implement allowlist only if staging requires cross-origin | Engineering | P1 | Yes if cross-origin | Yes |
| R-013 | Migration strategy not exercised in staging | Database | Documented | Prisma migrations exist; db push prohibited | No staging migration runbook evidence | Data/schema drift | Medium | Use migrations only via approved staging step | Engineering/Ops | P1 | Yes | Yes |
| R-014 | Audit logging incomplete for admin/security events | Audit | Partial | `AuditLog` schema exists | No comprehensive admin action writes | Weak forensic trail | Medium | Add audit writes for auth, module, tenant admin actions | Engineering | P1 | No | Yes |
| R-015 | Rate limiting/brute force controls not complete | Auth/API | Partial | Failed count and lockout fields | No IP/global rate limit or staging test | Credential stuffing | Medium | Add rate limit at app/proxy and test lockout | Engineering/Ops | P1 | Yes | Yes |
| R-016 | Error leakage not externally reviewed | API | Partial | Generic auth errors and response helpers | No fuzz/negative test report | Data disclosure | Medium | Run negative tests for auth, tenant, module, errors | Auditor | P1 | No | Yes |
| R-017 | Dependency vulnerability workflow incomplete | Supply chain | Partial | Dependabot and CI exist | No documented audit cadence | Vulnerable packages | Medium | Add dependency audit/review workflow before beta | Engineering | P2 | No | Yes |
| R-018 | CSRF assessment pending | Web/API | Not verified | Bearer-token MVP uses sessionStorage | Cookie strategy undecided; CSRF controls not exercised | CSRF if cookies later used | Medium | Assess CSRF when session transport is finalized | Security | P1 | Conditional | Yes |
| R-019 | Frontend token storage needs final decision | Frontend/session | Partial | Session storage MVP documented | Browser storage risks remain | Token theft via XSS | Medium | Reassess token storage; prefer secure HttpOnly cookies if feasible | Security/Engineering | P1 | No | Yes |
| R-020 | Database least privilege not verified | Database | Not verified | Local dev DB user only | No staging/prod role policy evidence | Excess DB impact after compromise | Medium | Create least-privilege staging/prod DB roles | Ops | P1 | Yes | Yes |
| R-021 | Security headers/CSP/HSTS not verified | Deployment | Not verified | Reverse proxy plan only | No deployed headers evidence | XSS/clickjacking/session risk | Medium | Configure TLS, HSTS after domain, CSP, frame protections | Ops/Security | P1 | Yes | Yes |
| R-022 | Build/runtime parity not validated on VPS | Deployment | Not verified | Local build passes | No VPS artifact/start strategy evidence | Staging drift | High | Add production start strategy and dry run | Engineering/Ops | P1 | Yes | Yes |

## Medium

| Risk ID | Title | Area | Current status | Evidence / current control | Gap | Impact | Likelihood | Recommended remediation | Owner | Priority | VPS blocker | Client blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-023 | Finance Lite is placeholder only | Modules | Documented | Module contract skeleton | No Finance Lite data isolation review | False feature expectations | Medium | Keep disabled/placeholder until scoped migration | Product | P2 | No | Yes if promised |
| R-024 | No client-ready onboarding/access flow | Product/Auth | Missing | Local seed only | No production-safe user lifecycle | Manual account mistakes | High after launch | Design invite/admin bootstrap before client access | Product/Engineering | P1 | No | Yes |
| R-025 | Monitoring/alerting/log retention not verified | Ops | Not verified | Not deployed | No operational visibility evidence | Incidents missed | Medium | Define logs, alerts, retention, privacy boundaries | Ops | P2 | No | Yes |
| R-026 | Failed-login lockout not staged | Auth | Partial | `failedLoginCount`, `lockedUntil`, policy envs | No staging evidence | Brute force risk | Medium | Test lockout/rate limit in staging smoke | Engineering | P1 | Yes | Yes |
| R-027 | Rollback drill missing | Ops | Documented | Rollback concept in staging plan | No drill evidence | Longer outages | Medium | Run dry rollback before client access | Ops | P2 | No | Yes |
| R-028 | Email sending not integrated | Auth | Missing | Invite/reset out of scope | No secure email workflow | Blocks invites/reset | High when onboarding | Design email provider and templates safely | Product/Engineering | P2 | No | Yes |

## Low

| Risk ID | Title | Area | Current status | Evidence / current control | Gap | Impact | Likelihood | Recommended remediation | Owner | Priority | VPS blocker | Client blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-029 | Documentation may drift from implementation | Governance | Partial | Audit pack and MVP docs | Manual updates needed | Confused operations | Medium | Update audit docs each release gate | Engineering | P3 | No | No |
| R-030 | Incident response runbook missing | Ops | Missing | None | No contact/escalation path | Slower response | Medium after clients | Add incident response contacts and severity process | Owner/Ops | P2 | No | Yes |

## Summary

The local MVP is acceptable for local validation only. It is not acceptable for client access until high-risk gaps around staging validation, tenant isolation tests, browser QA, secrets, backup/restore, authorization review, and operational readiness are closed.

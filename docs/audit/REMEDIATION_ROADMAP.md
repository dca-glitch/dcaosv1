# Remediation Roadmap

## Must Fix Before VPS Staging

| Item | Risk addressed | Recommended implementation | Validation/smoke needed | Complexity | Dependency | Suggested phase |
| --- | --- | --- | --- | --- | --- | --- |
| VPS Docker Compose execution | VPS runtime drift | Build and run approved Docker Compose services on `dca_net` | `npm run validate`, API health | Medium | Deployment target | Deploy Prep 1 |
| Staging env contract | Secret/config mistakes | Finalize env names and host secret handling | Env presence check without values | Small | VPS host | Deploy Prep 1 |
| Staging DB safety | Wrong DB target | Create staging DB and least-privilege user | Prisma validate against staging only after approval | Medium | DB host | Deploy Prep 2 |
| Migration runbook | Schema drift/data loss | Use migrations only; no `db push` | Staging migration dry run | Medium | Backup plan | Deploy Prep 2 |
| TLS/reverse proxy plan | Transport/session risk | Configure HTTPS same-origin proxy | Health and smoke through proxy | Medium | Domain/DNS | Deploy Prep 3 |
| Staging smoke execution | Missed regressions | Run reviewed staging smoke command after host and credentials are approved | Staging smoke checklist | Small | Staging test user | Deploy Prep 3 |
| Browser QA checklist | UI/session defects | Manual browser QA with screenshots | Login/logout/module/team/settings | Small | Staging URL | Deploy Prep 4 |

## Must Fix Before Client Access

| Item | Risk addressed | Recommended implementation | Validation/smoke needed | Complexity | Dependency | Suggested phase |
| --- | --- | --- | --- | --- | --- | --- |
| Tenant isolation negative tests | Cross-tenant data leak | Add multi-tenant fixture and automated negative tests | Tenant isolation test plan | Medium | Fixture data | Security Gate 1 |
| External auth/session review | Auth/session flaws | Auditor reviews code and staging behavior | Review report | Medium | Staging URL | Security Gate 1 |
| Password reset/admin recovery decision | Account lockout | Decide and implement safe recovery path | Recovery tests | Medium/Large | Email/admin policy | Auth Gate 2 |
| Invite/onboarding flow | Unsafe manual users | Design and implement invite flow or admin bootstrap | Invite tests | Large | Email provider | Auth Gate 3 |
| Admin action audit logging | Weak forensics | Audit login/logout, tenant switch, module/settings mutations | Audit log tests | Medium | Audit policy | Audit Gate 1 |
| Backup/restore drill | Data loss | Run restore test and document result | Restore evidence | Medium | DB backup tooling | Ops Gate 1 |
| Security headers/CSP | Browser risk | Configure proxy/app headers | Header scan | Medium | Reverse proxy | Ops Gate 2 |
| Dependency review workflow | Supply-chain risk | Add vulnerability review process | Audit output or policy | Small | Owner policy | CI Gate 2 |

## Should Fix Before Beta

| Item | Risk addressed | Recommended implementation | Validation/smoke needed | Complexity | Dependency | Suggested phase |
| --- | --- | --- | --- | --- | --- | --- |
| Monitoring and alerting | Missed incidents | Add service logs, uptime, error alerts | Alert test | Medium | VPS stack | Ops Gate 3 |
| Incident response runbook | Slow response | Define contacts, severity, actions | Tabletop exercise | Small | Owner input | Ops Gate 4 |
| Privacy/data retention notes | Compliance/privacy drift | Define retention and minimization | Docs review | Small | Legal/owner input | Governance 1 |
| Role management design | Permission drift | Formalize roles beyond hardcoded MVP | Authorization tests | Large | Product decisions | RBAC Gate 2 |

## Future Hardening

| Item | Risk addressed | Recommended implementation | Validation/smoke needed | Complexity | Dependency | Suggested phase |
| --- | --- | --- | --- | --- | --- | --- |
| OAuth/SSO if required | Enterprise auth needs | Implement approved provider flow | Provider integration tests | Large | Customer requirement | Auth Expansion |
| MFA | Account takeover | Add optional MFA for admins | MFA tests | Large | Auth UX | Auth Expansion |
| Finance Lite migration | Module data isolation | Scope and migrate only after module gate | Module isolation tests | Large | Finance spec | Module Gate |
| Dynamic module loading | Plugin risk | Security-reviewed loader only if needed | Loader tests | Large | Architecture decision | Future Platform |

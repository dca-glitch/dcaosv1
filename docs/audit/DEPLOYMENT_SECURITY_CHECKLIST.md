# Deployment Security Checklist

## A. Before VPS Staging

- [ ] Repo is clean and synced.
- [ ] CI is green.
- [ ] Required env vars are prepared by name only in docs.
- [ ] Staging DB is created.
- [ ] Staging DB contains no production data.
- [ ] Migration plan is approved.
- [ ] `prisma db push` is not used.
- [ ] Reverse proxy TLS plan is reviewed.
- [ ] CORS origin strategy is set; prefer same-origin `/api/v1`.
- [ ] Staging smoke script or reviewed allow-staging flag is prepared.
- [ ] Backup snapshot is taken before migration.
- [ ] Rollback path is documented.
- [ ] No public client access is enabled.
- [ ] Secrets are stored on the host, not in Git.
- [ ] Production credentials are absent from staging host.

## B. Before Client Access

- [ ] External security review is complete.
- [ ] Tenant isolation negative tests pass.
- [ ] Browser QA passes with screenshots or signed checklist.
- [ ] Password reset or admin recovery decision is approved.
- [ ] Invite/onboarding decision is approved.
- [ ] Backup/restore is tested.
- [ ] Monitoring/logging is reviewed.
- [ ] Audit logging is reviewed.
- [ ] Security headers and CSP are verified.
- [ ] HTTPS-only behavior is verified.
- [ ] HSTS is enabled at proxy after domain confirmation.
- [ ] Dependency vulnerability review is complete.
- [ ] Privacy/data retention notes are approved.
- [ ] Incident response contacts are documented.
- [ ] Support/admin runbook exists.
- [ ] No production data is used in test/staging workflows.
- [ ] Client access decision is explicitly approved by owner.

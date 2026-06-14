# VPS Staging Execution Approval Pack

## Purpose

This pack is the final repo-side approval artifact before any controlled VPS staging deployment. It does not approve deployment by itself. It defines what the owner may approve in a future execution step and what remains forbidden.

Current approved repo baseline:

- Commit: `101fa9f` - Add production-like API start path for staging.
- Branch: `main`.
- CI: must be green on the exact commit before execution.

## Repo Readiness Confirmation

- API has a production-like compiled JavaScript build path: `npm run -w @dca-os-v1/api build`.
- API has a Node start command for compiled output: `npm run -w @dca-os-v1/api start`.
- API compiled entry: `apps/api/dist/apps/api/src/server.js`.
- Local API development remains `npm run -w @dca-os-v1/api dev` and must not be used as the staging runtime.
- Web has a production build command: `npm run -w @dca-os-v1/web build`.
- Web defaults to same-origin `/api/v1` via `VITE_API_BASE_URL`.
- Staging smoke exists as `npm run smoke:mvp:staging`.
- Local smoke remains local-only by default.

No repo-side blocker remains for asking the owner to approve controlled VPS staging execution. Execution is still blocked until the owner approves VPS access, staging DB setup, secrets handling, migration scope, process supervisor choice, reverse proxy changes, and staging smoke/browser QA.

## Process Supervisor Recommendation

| Option | Complexity | Reliability | Restart behavior | Logging | Fit now | Future fit |
| --- | --- | --- | --- | --- | --- | --- |
| systemd | Low/medium | High on a single VPS | Native restart policies | `journalctl` plus app logs | Best fit for early small-scale staging | Good until multi-service orchestration becomes necessary |
| Docker Compose | Medium/high | High if VPS is already containerized | Container restart policies | Docker logs or external log stack | Good only if the VPS deployment standard is already container-first | Strong for future multi-service module stacks |
| PM2 | Low | Good for Node apps | Node-specific process restart | PM2 logs | Acceptable but adds a Node-specific manager | Less general than systemd or Compose |

Recommendation: use `systemd` first for early DCA OS v1 staging unless the VPS is already standardized around Docker Compose. Use PM2 only if the owner explicitly prefers a Node-specific process manager.

Approval gate:

- Owner approves the process supervisor before deployment.
- Supervisor config is reviewed before it is applied.
- Previous service target/revision is recorded for rollback.
- Supervisor logs and restart policy are captured as evidence.

## Staging Database Strategy

- Use a separate staging PostgreSQL database.
- Use no production data.
- Use no client data.
- Use staging-only credentials.
- Use Prisma migrations only.
- Never use `prisma db push`.
- Take a staging DB backup before any migration.
- Review migration files before any migration.
- Require explicit human approval before any migration command.
- Collect migration output evidence.
- Stop immediately if Prisma requests destructive reset or unexpected data loss.

## Secrets And Env Handling

Secrets are handled on the server only. Values must never be committed, printed, pasted into reports, or captured in screenshots.

Env var names may be listed. Values must be masked.

Required runtime names currently documented:

- Backend: `PORT`, `DATABASE_URL`.
- Web/build: `VITE_API_BASE_URL`.
- Auth policy: `AUTH_SESSION_TTL_MINUTES`, `AUTH_LOGIN_MAX_FAILED_ATTEMPTS`, `AUTH_LOGIN_LOCKOUT_MINUTES`.
- Staging smoke: `MVP_SMOKE_API_BASE_URL`, `AUTH_SEED_TEST_EMAIL`, `AUTH_SEED_TEST_PASSWORD`, optional `AUTH_SEED_TESTER_EMAIL`, optional `AUTH_SEED_TESTER_PASSWORD`.

Session/cookie decision:

- Current MVP uses bearer tokens returned to the client and hashed session tokens in the database.
- No committed `SESSION_SECRET` placeholder exists.
- Before cookie-backed sessions, signed session tokens, or HMAC session-token hashing are used in staging/client workflows, an explicit session secret name and runtime wiring must be approved.
- Cookie helper names such as `AUTH_SESSION_COOKIE_NAME`, `AUTH_SESSION_SECURE_COOKIES`, and `AUTH_SESSION_SAME_SITE` remain helper/planning-level unless the runtime transport is changed.

Separation rule:

- Local, staging, and production env files must be separate.
- Staging must not contain production DB credentials.
- Production env values must not be present on the staging host.

## Reverse Proxy And Domain Strategy

Expected staging route:

- Host: `staging.system.digitalcubeagency.net`.
- Transport: HTTPS only.
- Web: served through the reverse proxy.
- API: served under `/api/v1` through the same origin.
- CORS: no API CORS runtime is currently implemented; same-origin proxying is the expected staging shape.
- Smoke target: `https://staging.system.digitalcubeagency.net/api/v1`.
- Client access: blocked.

Do not change DNS, Caddy, reverse proxy config, or VPS firewall rules until explicitly approved.

## Migration Approval Gate

Before migration:

- Confirm exact commit.
- Inspect migration folders under `packages/data/prisma/migrations`.
- Confirm staging DB target by host/database name without printing the full `DATABASE_URL`.
- Confirm production DB credentials are absent.
- Create a staging DB backup.
- Confirm rollback path.
- Get explicit human approval for the exact migration command.

During migration:

- Run only approved Prisma migration commands.
- Never run `prisma db push`.
- Stop on destructive reset prompts or unexpected data-loss warnings.
- Capture command output with secrets masked.

After migration:

- Run API health check.
- Run staging smoke after deployment.
- Record evidence.

## Backup And Rollback Gate

Required evidence before execution:

- Previous app revision recorded.
- Current git commit recorded.
- Staging DB backup created before migration.
- Rollback app revision/path documented.
- Process supervisor restart/rollback path documented.
- Smoke failure stop condition documented.

Stop conditions:

- Build fails.
- Prisma validation fails.
- Migration asks for destructive reset.
- Health check fails.
- Smoke fails.
- Secrets appear in logs.
- Any command targets production or an unapproved host.

## Staging Smoke And Browser QA Gate

Staging smoke:

- Command: `npm run smoke:mvp:staging`.
- Requires explicit `MVP_SMOKE_API_BASE_URL`.
- Requires HTTPS.
- Allows only `staging.system.digitalcubeagency.net`.
- Requires `/api/v1`.
- Requires staging-only credentials supplied through the shell.
- Must not print passwords, tokens, cookies, auth headers, password hashes, session token hashes, or full database URLs.

Browser QA after deployment:

- Confirm HTTPS loads the web shell.
- Confirm login/logout behavior.
- Confirm `/auth/me`, `/auth/context`, tenant view, modules view, Team, and Settings.
- Capture screenshots or a signed checklist.
- Confirm no client access is enabled.

## Tenant And Security Negative Test Gate

Required before client access:

- Invalid module key returns standardized error.
- Disabled module access is denied when feature routes exist.
- Tenant switch negative cases are denied.
- Missing active tenant context is denied.
- Cross-tenant member detail ID does not leak data.
- Insufficient permission cannot enable/disable modules.
- Unauthenticated access returns unauthorized on protected routes.
- Stale/invalid session behavior returns unauthorized.

These tests may be manual first, but they must become repeatable before client access.

## Future Deployment Approval Scope

The owner may approve a future controlled staging execution that includes only:

- VPS login.
- Pull exact approved commit.
- Install dependencies.
- Validate and build.
- Configure staging env on the host.
- Configure approved process supervisor.
- Configure approved reverse proxy.
- Create staging DB.
- Run approved staging migration only.
- Start staging app.
- Run health, smoke, and browser QA.

Still forbidden unless separately approved:

- Production DB access.
- Production migration.
- Client access.
- Production data import.
- Unreviewed hotfixes on the VPS.
- `prisma db push`.
- Printing secrets.
- Broad refactors.
- Deploying uncommitted code.
- Deploying a commit other than the exact approved commit.

## Approval Statement Template

The owner may use this exact shape for the future execution gate:

```text
I approve controlled VPS staging execution for DCA OS v1 commit <commit>.
Approved host: staging.system.digitalcubeagency.net.
Approved process supervisor: <systemd|Docker Compose|PM2>.
Approved database target: staging-only PostgreSQL, no production/client data.
Approved migration scope: Prisma migrations only, no db push.
Approved smoke target: https://staging.system.digitalcubeagency.net/api/v1.
Client access remains blocked.
Secrets must not be printed.
Stop if any command targets production, requests destructive reset, or smoke fails.
```

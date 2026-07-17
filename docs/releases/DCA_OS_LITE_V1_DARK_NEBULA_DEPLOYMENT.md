> **Historical deployment evidence.** This release note records the earlier Dark Nebula deployment and is retained only for provenance. Botanical Light is the current UI direction.

# DCA OS Lite — Version 1 Dark Nebula Deployment

Date: 2026-06-16  
Production URL: https://system.digitalcubeagency.net  
Version status: Version 1 UI deployment closed  
Deployed commit: 739a029  
Release scope: Dark Nebula Product UI Phase 1

## Summary

Dark Nebula Product UI Phase 1 was merged to `main`, deployed to the DCA OS Lite VPS, and verified in production.

The deployment updated the public frontend UI and the DCA OS Lite API image used to serve the current application build. Browser verification confirmed that the new Dark Nebula login and dashboard experience is visible in production.

## Production deployment result

Deployed API image:

```text
appnext-202606160739a029-dcaosv1-api
```

Running container:

```text
dcaosv1-api
```

Production frontend static path served by Caddy:

```text
/opt/dca/apps/dcaosv1/app/apps/web/dist
```

Frontend dist backup created before replacement:

```text
/opt/dca/apps/dcaosv1/app/apps/web/dist.backup-20260616031332
```

New deployed frontend assets observed in public HTML:

```text
/assets/index-CmBSnZKa.js
/assets/index-DOjpH-UV.css
```

## Verification

Server-side checks passed:

```text
Public frontend: HTTP/2 200
API health: ok
Postgres: healthy
Caddy: running
```

Browser checks passed:

```text
Login page loads with Dark Nebula UI
Turnstile remains visible / operational
Login works
Dashboard loads with Dark Nebula UI
Dashboard copy visible:
"Run your operations from DCA OS command center."
```

## Safety confirmations

No database migrations were run.

No database schema changes were made.

No auth logic was changed.

No Turnstile logic was changed.

No secrets were printed.

No Caddy config change was made.

Postgres remained running and healthy.

Caddy remained running.

The frontend dist was backed up before replacement.

## Notes for future deploys

The VPS deployment currently has two relevant application locations:

```text
/opt/dca/apps/dcaosv1/app.next-*
/opt/dca/apps/dcaosv1/app/apps/web/dist
```

The API container is built from an `app.next-*` tree, but Caddy serves public frontend static assets from:

```text
/opt/dca/apps/dcaosv1/app/apps/web/dist
```

Future UI deployments must update both:

1. the DCA OS Lite API/app image, if required by the deployment process
2. the Caddy-mounted frontend dist path

Do not assume the public frontend is served directly from the newest `app.next-*` tree.

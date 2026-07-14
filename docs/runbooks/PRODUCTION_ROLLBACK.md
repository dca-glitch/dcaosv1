# Production Rollback Procedure (Reference)

**Status:** Procedure reference. After G50 PASS (2026-07-14), primary production rollback baseline is artifact `/opt/dca/production-artifacts/57f9c52` and image `app-dcaosv1-api:57f9c52`. Fresh pre-G50 backups under `/opt/dca/backups/*before-c5e03eb-20260714T155227Z*`. No rollback was required during G50. Post-deploy proof confirmed rollback artifact/image still retained (2026-07-14).

**Workstream 1 Point 3 (2026-07-12):** Staging/local compatibility verdict is `ROLLBACK READY WITH CONDITIONS`. Known-good staging rollback target remains artifact `1b8d00d`. Schema delta `1b8d00d..250e958`: none. Rollback **rehearsal is not executed** and remains separately gated. No SHA-tagged retained staging API image is claimed until the staging safeguard phase tags `staging-dcaosv1-staging-api:1b8d00d`. Production remains FROZEN.

---

## 1. Rollback decision tree

```text
Production health check fails OR smoke fails OR unexpected error rate
  │
  ├─ Is the API container the only thing changed?
  │     ├─ YES → Roll back API container to previous image/artifact tag (§2.1). Re-check health.
  │     └─ NO  → continue
  │
  ├─ Did a migration run as part of this deploy?
  │     ├─ YES → STOP new traffic if possible. Restore DB from pre-migration backup (§2.2).
  │     │         Re-deploy previous API image against restored DB. Re-check health.
  │     └─ NO  → continue
  │
  ├─ Did web assets (dist) change?
  │     ├─ YES → Restore previous dist backup (§2.3). Force-recreate Caddy if mount looks stale.
  │     └─ NO  → continue
  │
  └─ Still unhealthy after rollback?
        → STOP. Do not retry deploy. Escalate to owner with full evidence log.
```

---

## 2. Rollback actions (reference commands — not executed)

### 2.1 API container rollback

- Identify the previous known-good image tag (recorded before deploy per [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) §3 step 3).
- Recreate `dcaosv1-api` using that previous tag only — no `--build`.
- Re-run `GET /api/v1/health` and confirm `200` + `database.status: ready`.

### 2.2 Database restore

- Required backup: a `pg_dump` (or equivalent) of `dcaosv1-postgres` taken immediately before any `prisma migrate deploy` on production.
- Restore into the same container/volume, not a new one, to avoid orphaning connection strings.
- After restore, confirm row counts on a few key tables (`Tenant`, `Client`, `AiDeliveryProject`) are consistent with pre-migration expectations before resuming traffic.

### 2.3 Web asset (dist) rollback

- Required backup: a timestamped copy of the previous `dist` directory (mirrors the G46d staging pattern: `/opt/dca/apps/dcaosv1/staging/backups/web-dist-before-g46d-<timestamp>`; production equivalent should follow the same naming convention under a production backups path).
- Restore by copying the backup contents back into the mounted `dist` directory in place.
- If Caddy serves stale content after restore, force-recreate Caddy only: `docker compose -f /opt/dca/docker-compose.yml up -d --force-recreate --no-deps caddy`. Do not modify the Caddyfile itself unless the Caddyfile was the thing that changed.

### 2.4 Caddy/proxy rollback

- Only relevant if a future production change touches the Caddyfile.
- Restore from the most recent Caddyfile backup (e.g. the pattern used in G54: `/opt/dca/backups/Caddyfile.G54-HSTS.<timestamp>.bak`).
- Run `caddy validate` before reload. Reload scope: `dca-caddy` only — never full stack restart.

---

## 3. Evidence required before any rollback is "proven" (not yet satisfied)

1. A real backup file (DB dump or dist snapshot) with a timestamp, taken immediately before a real production mutation.
2. A real restore executed from that backup with a recorded before/after health check.
3. Confirmation that the restore did not affect staging or any other tenant's data.
4. A written record of elapsed time from failure detection to restored health.

**None of the above has happened yet** because no production mutation (G50) has occurred. This document remains a procedure, not a proof, until a real G50 execution (and, ideally, one deliberate rollback drill) generates that evidence.

---

## 4. Rollback drill recommendation (future, separate approval)

Before G50 is used for a real client-facing change, consider running one deliberate rollback drill on **staging** (not production) to validate this exact procedure end-to-end and attach the resulting log as the first real evidence artifact for §3. This is a recommendation only — it requires its own separate owner approval and is not authorized by this document.

**Current gate status (WS1 Point 3):** plan = `ROLLBACK READY WITH CONDITIONS`; rehearsal = **pending / not executed**. Do not mark rehearsal complete from documentation alone.

---

## 5. What this document does not authorize

- No backup creation, restore, container recreate, or Caddy reload was performed while writing this document.
- No production or staging mutation is authorized by this document.
- G50 remains **not executed**.

# Legacy WordPress Config Sunset

**Status:** Implemented locally (operational block after Architecture Block 2). Production removal of read-only GET remains a separate gate if needed.

**Scope:** Retire tenant-global WordPress configuration in favor of per-client `PublicationTarget` records in Client Hub.

---

## What changed

| Surface | Before | After |
|---------|--------|-------|
| `POST /api/v1/tenant/wordpress-config` | Saved tenant-level site URL config | **410 Gone** — `WORDPRESS_CONFIG_DEPRECATED` |
| `GET /api/v1/tenant/wordpress-config` | Read tenant-level config | **Read-only** — returns existing stored config if any, with deprecation/sunset meta |
| Company Profile UI | Tenant WordPress form | Banner only — directs operators to **Clients → Open hub → Publication targets** |
| MVP smoke | Saved via legacy endpoint | Creates/lists publication targets; asserts legacy POST is blocked |

Approved replacement:

- `GET/POST /api/v1/clients/:clientId/publication-targets`
- `POST/DELETE /api/v1/clients/:clientId/publication-targets/:publicationTargetId/credentials` (Block 4)

Implementation:

- Handler: `apps/api/src/controllers/coreController.ts`
- Client Hub UI: `apps/web/src/pages/client-hub/ClientHubPage.tsx`

---

## API behavior

### Blocked save (sunset)

```http
POST /api/v1/tenant/wordpress-config
```

Response:

- HTTP **410**
- Error code: `WORDPRESS_CONFIG_DEPRECATED`
- Headers: `Deprecation: true`, `Link: </api/v1/clients/{clientId}/publication-targets>; rel="successor-version"`

### Read-only legacy GET

```http
GET /api/v1/tenant/wordpress-config
```

Response meta includes:

- `deprecated: true`
- `readOnly: true`
- `sunset: true`
- `replacement`: publication-target path guidance

Use only to inspect old tenant settings during migration. Do not build new features on this route.

---

## Local verification

1. Ensure API is running: `npm.cmd run dev:api`
2. Run focused smoke:

```powershell
cd C:\dcaosv1
npm.cmd run smoke:legacy-wordpress-sunset:local
```

3. Full MVP smoke also covers publication targets:

```powershell
npm.cmd run smoke:mvp:local
```

Requires `AUTH_SEED_TEST_PASSWORD` in the shell or `.env`.

---

## Operator migration

1. Open **Clients** → select client → **Open hub**.
2. Add one or more **Publication targets** (site URL, default flag).
3. Save **WordPress credentials** on the target when encryption is configured (Block 4).
4. Use AI Delivery deliverables workflow for prepare/publish (Block 5).

Do not recreate tenant-global WordPress settings.

---

## Related docs

- `docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`
- `docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`
- `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md` — Block 2 PublicationTarget

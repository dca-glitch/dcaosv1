# WordPress Publish Local Gate (Block 5)

**Status:** Implemented locally. Production live publish on Puriva remains a separate owner/deploy gate.

**Scope:** Real WordPress REST publish attempt when `WORDPRESS_PUBLISH_ENABLED=true` and encrypted publication target credentials exist. Default local dev keeps publish **off**.

---

## Prerequisites

1. Block 4 complete: `CREDENTIAL_ENCRYPTION_MASTER_KEY` in local `.env` (32-byte base64).
2. API restarted after any env change.
3. `AUTH_SEED_TEST_PASSWORD` available to smoke scripts.

Related:

- `docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`
- `docs/security/LEGACY_WORDPRESS_CONFIG_SUNSET.md`

---

## Environment

```env
CREDENTIAL_ENCRYPTION_MASTER_KEY=
WORDPRESS_PUBLISH_ENABLED=false
```

Set `WORDPRESS_PUBLISH_ENABLED=true` only on a controlled machine after credentials are saved per client in Client Hub.

Restart API:

```powershell
cd C:\dcaosv1
npm.cmd run dev:api
```

---

## Local verification

### Default gate (publish off)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:wordpress-publish:local
```

Expect `provider_disabled` on publish and a `PROVIDER_DISABLED` PublicationLog entry.

### Open gate (publish on, no real WordPress required)

Restart API with both env vars set, then:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED = "true"
npm.cmd run smoke:wordpress-publish:local
```

Expect publish status `error` (smoke target URL is not a real WordPress site) — proves the HTTP path ran. PublicationLog status should be `FAILED`.

A real Puriva publish requires a valid publication target URL and Application Password on the live site.

---

## Operator flow (Puriva)

1. Client Hub → publication target for `puriva.id` (or subdomain).
2. Save encrypted Application Password (Block 4).
3. AI Delivery → Deliverables → prepare draft → **Publish to WordPress** (double-confirm UI).
4. Review PublicationLog in Client Hub.

---

## Safety

- Credentials never returned by API after save.
- Publish responses and logs must not contain application passwords.
- Do not enable production publish without owner sign-off per `docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`.

# Post-MVP Block 45 — WordPress Publish Open Gate Local Probe

**Status:** Local open-gate probe for Architecture Block 5 WordPress publish HTTP path when publish flag is enabled.

**Scope:** Focused proof that `WORDPRESS_PUBLISH_ENABLED=true` routes publish attempts through the real HTTP adapter. Default local dev keeps publish **off**. No schema or auth behavior changes.

Related:

- `docs/security/WORDPRESS_PUBLISH_LOCAL_GATE.md`
- `docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`
- `scripts/smoke-wordpress-publish-local.mjs`

---

## Run (baseline — publish off)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:wordpress-publish:local
```

Included in `npm run smoke:pre-staging:local`.

Expect `provider_disabled` on publish and a `PROVIDER_DISABLED` PublicationLog entry.

---

## Run (open gate — publish on, owner/manual)

1. Ensure Block 4 master key is configured if testing credential save paths.
2. Stop local API.
3. Set in `.env` or process env:

```env
WORDPRESS_PUBLISH_ENABLED=true
```

4. Restart API: `npm.cmd run dev:api`
5. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED = "true"
npm.cmd run smoke:wordpress-publish:local
Remove-Item Env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED -ErrorAction SilentlyContinue
```

Expect publish status `error` (smoke target URL is not a real WordPress site) — proves the HTTP path ran. PublicationLog status should be `FAILED`.

6. Restore `WORDPRESS_PUBLISH_ENABLED=false` and restart API before other smokes.

---

## Pass criteria

- Admin login succeeds
- Baseline: publish returns `provider_disabled`; no live HTTP call
- Open gate: publish attempt executes HTTP adapter; log entry records failure without leaking Application Password
- Responses and logs never contain application passwords or ciphertext

---

## Notes

- Real Puriva publish requires valid publication target URL and Application Password on the live site (owner gate).
- Production live publish requires owner sign-off per `docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md` Phase D.
- Pre-staging orchestrator keeps publish off; open gate proof is manual/owner-triggered.

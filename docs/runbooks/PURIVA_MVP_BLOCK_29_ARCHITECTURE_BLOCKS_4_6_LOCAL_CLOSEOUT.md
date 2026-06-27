# Puriva MVP Block 29 — Architecture Blocks 4–6 Local Closeout Reference

**Status:** Local operator reference for client/domain architecture smokes already included in pre-staging.

**Scope:** Documents the existing local gates for encrypted credentials (Block 4), WordPress publish + PublicationLog (Block 5), and tenant module middleware (Block 6). No new smoke scripts — confirms orchestrator coverage.

Related:

- `scripts/smoke-credential-encryption-local.mjs`
- `scripts/smoke-wordpress-publish-local.mjs`
- `scripts/smoke-tenant-module-local.mjs`
- `scripts/smoke-legacy-wordpress-sunset-local.mjs`
- `docs/security/` block operator docs

---

## Run

Included in `npm run smoke:pre-staging:local` (backend-heavy section after API restart).

Standalone:

```powershell
npm.cmd run smoke:credential-encryption:local
npm.cmd run smoke:wordpress-publish:local
npm.cmd run smoke:tenant-module:local
npm.cmd run smoke:legacy-wordpress-sunset:local
```

---

## Pass criteria

- Credential encrypt roundtrip passes locally (master key from env when set)
- WordPress publish smoke accepts local disabled provider shape
- Tenant module smoke passes in default `off` mode
- Legacy WordPress sunset returns expected 410/read-only behavior

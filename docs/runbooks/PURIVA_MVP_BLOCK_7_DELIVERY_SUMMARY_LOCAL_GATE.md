# Puriva MVP Block 7 — Delivery Summary Local Gate

**Status:** Local gate for client-safe Puriva delivery overview in Client Portal.

**Scope:** Extends `smoke:client-portal:local` with a full Puriva-path fixture:

- Market Intelligence handoff applied to the AI Delivery project (client-safe summary + recommended actions)
- DELIVERED deliverable with Google Docs `exportUrl`
- WordPress publish attempt + `PublicationLog` row (website publishing status)

Does **not** deploy to VPS or enable production publish.

Related:

- `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md` — Puriva MVP visibility rules
- `scripts/smoke-client-portal-local.mjs`
- `docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`

---

## Prerequisites

1. Local API + PostgreSQL running.
2. `AUTH_SEED_TEST_PASSWORD` set.
3. Modules enabled for local tenant (`npm run seed:db1` after pull).

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:local
```

Or full local closeout:

```powershell
npm.cmd run smoke:pre-staging:local
```

---

## Pass criteria

New smoke records (after ClientUserAccess link):

- `puriva delivery summary includes market intelligence summary`
- `puriva delivery summary includes recommended actions`
- `puriva delivery summary includes google docs export`
- `puriva delivery summary includes website publishing status`
- `puriva delivery summary hides internal mi fields` (no `sourceNote`, `audienceSignals`, `risks`, workflow internals)

---

## Safety

- Client Portal must not expose raw MI internals, credentials, or storage keys.
- Production Puriva publish remains a separate owner gate (Block 5 prod).

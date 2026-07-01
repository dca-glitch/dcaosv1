# Puriva Local Client Setup Foundation Gate

**Status:** Local operator setup for Puriva (`puriva.id`) without credentials, live publish, or deploy.

**Scope:** Idempotent admin setup for Puriva client profile, monthly AI Delivery project, WordPress draft-prep publication target placeholder, workflow brief foundation, and optional `ClientUserAccess` when `puriva@puriva.id` exists in the tenant.

Related:

- `scripts/setup-puriva-local.mjs`
- `scripts/smoke-puriva-client-setup-local.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/ai-delivery/client-onboarding-runbook.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run setup:puriva:local
npm.cmd run smoke:puriva-client-setup:local
```

Idempotency check (smoke runs setup twice internally):

```powershell
npm.cmd run smoke:puriva-client-setup:local
```

---

## Pass criteria

- Puriva client exists with `puriva.id` website metadata and Indonesia country
- Publication target placeholder points to `https://puriva.id` with **no stored credentials**
- Monthly AI Delivery project exists for the current target month
- Workflow brief foundation exists and is selectable in Workflow Briefs admin UI
- Second setup pass reuses the same records (no duplicate Puriva client)
- No secrets printed; no live WordPress or external provider calls

---

## Operator notes

- Client Portal access mapping is granted only when `puriva@puriva.id` is already a tenant member. The setup script does **not** create users or passwords.
- Publication handoff remains **draft prep only** — do not save Application Passwords until a separate approved gate.
- Production/staging mutation is out of scope for this block.

# Puriva Local E2E Operator Dry Run

**Status:** Local-only operator dry run pack  
**Use for:** Rehearsing the admin path from Puriva intake through final-safe archive/report outputs  
**Scope:** Local validation and browser QA only. No deploy, VPS, staging, production, live provider, live WordPress publish, GA/GSC sync, or R2 IO.

Related:

- [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](./PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md)
- [`PURIVA_FULL_DELIVERY_SMOKE_GATE.md`](./PURIVA_FULL_DELIVERY_SMOKE_GATE.md)
- [`PURIVA_STAGING_PRODUCTION_READINESS_GATE.md`](./PURIVA_STAGING_PRODUCTION_READINESS_GATE.md)
- [`docs/operator/client-delivery-sop.md`](../operator/client-delivery-sop.md)
- [`docs/operator/first-client-next-actions.md`](../operator/first-client-next-actions.md)

---

## What this pack proves

This dry run proves the local operator path is coherent:

1. Puriva intake and compliance facts are usable.
2. Verified facts can move into AI Knowledge/context.
3. WorkflowBriefs can carry intake into a brief.
4. SEO planning can stay grounded in verified context.
5. Content drafts, image/asset notes, and WordPress draft prep stay internal.
6. Client portal surfaces only review-safe or final-safe material.
7. Monthly report / archive outputs stay client-safe.

If any step needs live provider calls, live WordPress publish, GA/GSC sync, R2 IO, staging, or production, stop and do not continue in this local dry run.

---

## Preconditions

- `main` is clean and synced with `origin/main`.
- `AUTH_SEED_TEST_PASSWORD` is set in the shell.
- `npm.cmd run validate` passes.

---

## Recommended dry run sequence

Run from `C:\dcaosv1` and log each step to `$env:TEMP`.

1. `npm.cmd run smoke:admin-operations:local`
2. `npm.cmd run smoke:puriva-readiness:local`
3. `npm.cmd run smoke:ai-delivery-workflow:browser`
4. `npm.cmd run smoke:client-portal-monthly-report:browser`
5. `node scripts/smoke-client-approval-happy-path-local.mjs`

`npm.cmd run smoke:puriva-readiness:local` already covers:

- Puriva client setup
- Puriva full delivery chain
- Puriva client portal boundary
- Workflow brief publication handoff browser proof
- post-smoke validate

---

## Stop conditions

Stop immediately if:

- a step needs staging or production;
- a step needs live provider execution;
- a step would publish live WordPress content;
- a step asks for secrets beyond the existing local admin password env var;
- a step exposes internal draft, provider, or storage details to the client portal.

---

## Output expectations

After a clean run, the admin should be able to say:

- intake is verified;
- context is grounded;
- the brief and SEO plan are consistent;
- drafts and images are still internal;
- WordPress prep is draft-only;
- the client archive and monthly report stay client-safe.

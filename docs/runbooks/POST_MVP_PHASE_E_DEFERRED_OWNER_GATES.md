# Post-MVP Phase E — Deferred Owner Gates (Not Local Repo Work)

**Status:** Documentation-only boundary register. No implementation in this phase.

**Purpose:** Record what intentionally remains **outside** the approved local Post-MVP closeout (Blocks 31–57). Owner approval required before any item below becomes an active block.

Related:

- [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`docs/deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md)

---

## Deferred by design (Phase E)

| Area | Why deferred | Future gate |
|------|--------------|-------------|
| **Client Portal Phase 2** (magic links, full comment threads, advanced approve flows) | Deferred scope register | Separate approved MVP block |
| **VPS / staging execution** | Owner paused; staging target missing / not confirmed | Confirm real staging target + `VPS_STAGING_EXECUTION_APPROVAL_PACK` + `smoke:mvp:staging` |
| **Production env keys** (credential master, Google SA, OpenRouter live) | Owner-only secrets | Strict smokes with env + API restart |
| **Live WordPress auto-publish (prod)** | Block 5 local gate only today | Owner gate after staging |
| **Tenant module `enforce` on staging** | Requires seeded entitlements | Block 6 Gate 3 |
| **Auth invite / password reset UI** | Auth boundary — Block 53 copy gate only | Separate auth-approved block |
| **Live GA/GSC OAuth, Stripe, scraping** | PRD future modules | Module catalog future blocks |
| **Revenue Hub, POD AI, licensee tenant migration** | Future modules | ROADMAP / operating model |

---

## What Phase E does **not** authorize

- Schema or migration changes
- Auth, Turnstile, or session behavior changes
- API contract changes without separate approval
- VPS login, Caddy, DNS, Docker deploy, or production actions
- Package installs unless explicitly scoped

---

## Owner next steps (after local closeout PASS)

1. Review PR #13 / Phase F merge with `npm run smoke:pre-staging:local` evidence.
2. **Block G1:** Complete [`staging-target-decision-template.md`](../operator/staging-target-decision-template.md) and review [`PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md`](./PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md).
3. Approve VPS staging execution pack (Block G4 — separate decision).
4. Run strict Phase C env proofs on staging when keys are provisioned.
5. Pick **one** deferred item above for the next approved implementation block — never batch schema + API + UI.

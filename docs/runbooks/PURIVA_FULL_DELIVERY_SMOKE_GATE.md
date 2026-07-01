# Puriva Full Local Delivery Smoke Gate

**Status:** End-to-end local proof for Puriva delivery chain safety.

**Scope:** Integration smoke only — no provider calls, WordPress publish, live release, or client portal expansion.

Related:

- `scripts/smoke-puriva-full-delivery-local.mjs`
- `scripts/smoke-puriva-client-setup-local.mjs`
- `scripts/lib/puriva-local-setup.mjs`
- `docs/runbooks/PURIVA_IMAGE_PACKAGE_V1_GATE.md`

---

## What it proves

1. **Setup idempotency** — `ensurePurivaLocalSetup()` twice with stable IDs
2. **Structured input chain** — taxonomy + MI + SEO + content production + image package on workflow brief
3. **AI Delivery scaffolds** — content plan items, internal draft scaffolds, image prompt scaffolds (DRAFT only)
4. **Release package gates** — status observable; prepare/finalize blocked with expected error codes
5. **Publication handoff gates** — draft-prep mode only; execute blocked with expected error codes
6. **Admin browser** — Puriva workflow brief selectable; draft-prep disclaimer; no live publish wording
7. **Client portal boundary** — no handoff panel, internal prompts, storageKey, or provider metadata in API/browser responses

---

## Expected gates (foundation brief)

Puriva foundation brief is intentionally **not** linked through the full workflow packaging pipeline. Smoke expects:

| Action | Expected |
|---|---|
| `GET /release-package` | 200, not finalized, `canFinalizeReleasePackage=false` |
| `POST /prepare-release` | 400 `RELEASE_PREP_MISSING_PROJECT` or `RELEASE_PREP_NOT_READY` |
| `POST /finalize-release-package` | 400 missing project / prep / not ready |
| `GET /publication-handoff` | 200, `PREPARE_WORDPRESS_DRAFT`, `canExecuteHandoff=false` |
| `POST /execute-publication-handoff` | 400 with handoff gate code |

Admin UI release/handoff panels render only after deliverables are packaged (`packagedCount > 0`). For the Puriva foundation brief, API gate proof is authoritative; browser checks skip panel visibility with an explicit reason.

Medical review and internal scaffold gates remain blocking — smoke does not bypass them.

---

## Run

Prerequisite: local API + web running, `AUTH_SEED_TEST_PASSWORD` set.

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:puriva-full-delivery:local
npm.cmd run validate
```

Optional: stop local API/web before validate if Prisma EPERM occurs on Windows.

---

## Operator notes

- Admin-only image prompts and draft scaffolds are expected in admin AI Delivery records.
- Client portal must never expose those internal scaffold fields.
- This smoke is a safety proof, not a shortcut to final client release.

# Phase G — Post-Deferred Closeout Index

**Status:** Block G1 in progress (docs + owner decision).

**Branch convention:** `feature/phase-g-block-*`

**Prior closeout:** [`PHASE_F_LOCAL_CLOSEOUT_INDEX.md`](./PHASE_F_LOCAL_CLOSEOUT_INDEX.md)

---

## Block map

| Block | Runbook | Validation | Deploy |
|-------|---------|------------|--------|
| G1 | [`PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md`](./PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md) | Owner completes [`staging-target-decision-template.md`](../operator/staging-target-decision-template.md) | No |
| G2 | (merge Phase F PR + re-smoke) | `validate` + `smoke:pre-staging:local` on `main` | No |
| G3 | [`PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md`](./PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md) | Confusion log filled | No |
| G4 | [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) + owner approval statement | Build + health + `smoke:mvp:staging` | Staging only |
| G5+ | Per deferred owner gate register | Strict env smokes | Staging only |

---

## Pass criteria for Block G1

- Staging target decision template completed and stored (repo doc update or signed copy — no secrets).
- Owner confirms which host is **staging** vs **production** (resolves doc tension with legacy VPS pack drafts).
- VPS execution approval pack reviewed; G4 scope understood.
- No VPS login, migration, or deploy performed in G1.

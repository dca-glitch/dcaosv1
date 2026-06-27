# Phase G — Post-Deferred Closeout Index

**Status:** Block G1 closed (2026-06-27). Current block: **G2** (merge/re-smoke) / **G3** (practice run). **G4 not approved.**

**Branch convention:** `feature/phase-g-block-*`

**Prior closeout:** [`PHASE_F_LOCAL_CLOSEOUT_INDEX.md`](./PHASE_F_LOCAL_CLOSEOUT_INDEX.md)

---

## Block map

| Block | Runbook | Validation | Deploy |
|-------|---------|------------|--------|
| G1 | [`PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md`](./PHASE_G_BLOCK_1_STAGING_TARGET_AND_VPS_PACK.md) | [`staging-target-decision-template.md`](../operator/staging-target-decision-template.md) completed | No/docs closed |
| G2 | (merge Phase F PR + re-smoke) | `validate` + `smoke:pre-staging:local` on `main` | No |
| G3 | [`PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md`](./PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md) | Confusion log filled | No |
| G4 | [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) + owner approval statement | Build + health + `smoke:mvp:staging` | **Not approved** — staging only when approved |
| G5+ | Per deferred owner gate register | Strict env smokes | Staging only |

---

## Pass criteria for Block G1

- [x] Staging target decision template completed — `staging.digitalcubeagency.net` (see [`staging-target-decision-template.md`](../operator/staging-target-decision-template.md)).
- [x] Owner confirms staging vs production: staging = `staging.digitalcubeagency.net`; production = `system.digitalcubeagency.net`.
- [x] VPS execution approval pack reviewed; G4 scope understood; **G4 not approved**.
- [x] No VPS login, migration, or deploy performed in G1.
- [ ] DNS `staging` A record — **not created yet** (G4 prep only).

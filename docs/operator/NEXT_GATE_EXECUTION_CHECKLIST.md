# Next Gate Execution Checklist (G656)

**Status:** Pre-execution checklist for the next owner-selected gate after G468. G656 for G469–G708 ultra-block on baseline `66dcb74`. Docs-only; does **not** authorize live IO, staging mutation, production mutation, commit, push, or deploy.

**Default recommended first candidate (G469):** R2 target-environment real-bucket proof — see [`G468_NEXT_50_GATES.md`](./G468_NEXT_50_GATES.md). Owner may select a different launch-blocker.

**Hard truths:** local foundations expanding; live proofs deferred until this checklist is satisfied **and** owner approves the session; Puriva Launch **BLOCKED**; production frozen.

Related: [`LIVE_PROOF_APPROVAL_CHECKLIST.md`](./LIVE_PROOF_APPROVAL_CHECKLIST.md) · [`OWNER_GATE_CHECKLIST.md`](./OWNER_GATE_CHECKLIST.md) · [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md) · [`POWERSHELL_SAFETY_CHECKLIST.md`](./POWERSHELL_SAFETY_CHECKLIST.md)

---

## 1. Before selecting the gate

- [ ] Read `docs/STATUS.md` executive snapshot (source of truth).
- [ ] Confirm Puriva Launch still **BLOCKED** and production readiness **NO**.
- [ ] Confirm historical staging PASS is **not** standing authorization.
- [ ] Confirm local no-IO foundations (including concurrent G469+ helpers) are **not** treated as live proof.
- [ ] Confirm `.cursor/settings.json` remains untracked if present.

---

## 2. Owner selection (G469)

- [ ] Owner names the exact gate ID and environment (local controlled live / staging / production).
- [ ] Owner confirms blast-radius and cost controls.
- [ ] Owner confirms restore / disabled-safe plan.
- [ ] Commit / push / deploy remain **separate** approvals (not implied).

---

## 3. Preflight (PowerShell from `C:\dcaosv1`)

Run one command per line:

```powershell
cd C:\dcaosv1
git rev-parse HEAD
git status -sb
git diff --check
```

If code/runtime is involved:

```powershell
npm.cmd run validate
```

- [ ] Validate PASS (or docs-only exception accepted by owner).
- [ ] If validate fails: **stop**. Do not smoke. Do not live-call.
- [ ] Prefer a no-live / disabled-safe baseline smoke before any live step.
- [ ] Log long runs to `$env:TEMP`; open Notepad; scrub secrets before share.

---

## 4. Execution boundaries

| Allowed only with owner approval | Refuse without approval |
|---|---|
| Bounded R2 target-bucket IO | Real bucket IO from local foundations alone |
| Bounded OpenRouter / AI target call | Staging/prod AI from G77b local proof alone |
| One allowlisted email send | Marketing email / bulk send |
| GA/GSC OAuth + sync | Claiming Google ready from config helpers |
| WordPress staging draft HTTP | Auto-publish |
| Staging remote smokes / VPS | Production deploy (G50) while readiness NO |

---

## 5. After execution

- [ ] Restore disabled-safe config.
- [ ] Record honest taxonomy level ([`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md)).
- [ ] Propose protected-doc updates only for evidenced rows (main agent integrates).
- [ ] Reaffirm Puriva Launch **BLOCKED** unless launch re-score closes criteria.
- [ ] Reaffirm production readiness **NO** unless production gate closes.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

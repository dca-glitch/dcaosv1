# Live Proof Approval Checklist (G653)

**Status:** Pre-session checklist. Do not start a live proof until every applicable box is satisfied. G653 refresh for G469–G708 ultra-block on baseline `66dcb74`. Docs lane did not run live proofs.

**Hard truths:** live proofs remain **deferred**; Puriva Launch **BLOCKED**; production frozen. Local foundations (including G469+ no-IO helpers) do **not** satisfy this checklist.

Related: [`OWNER_GATE_CHECKLIST.md`](./OWNER_GATE_CHECKLIST.md) · [`NEXT_GATE_EXECUTION_CHECKLIST.md`](./NEXT_GATE_EXECUTION_CHECKLIST.md) · [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md)

---

## 1. Before the session (mandatory)

- [ ] Owner explicitly approved **this** live proof session (scope, environment, provider).
- [ ] Gate ID / runbook section identified (e.g. `STORAGE_R2_PROOF.md`, `AI_PROVIDER_LIVE_PROOF.md`).
- [ ] Environment labeled correctly: local controlled live vs staging vs production.
- [ ] Production freeze respected: production live enablement needs a production gate, not a staging approval.
- [ ] Cost / blast-radius controls documented (model, recipient allowlist, bucket cleanup, draft-only site).
- [ ] Restore / disabled-safe plan written (how to turn off after proof).
- [ ] Secrets handling: values only in shell/server env; never printed; log path in `$env:TEMP` planned.
- [ ] Commit / push / deploy are **not** implied by live-proof approval (separate approvals).
- [ ] PowerShell one-command-per-line plan ready (no `&&` chaining in operator steps).

---

## 2. During the session

- [ ] Run `git diff --check` and `npm.cmd run validate` first when code/runtime is involved.
- [ ] If validate fails: **stop**. Do not run smoke or live calls.
- [ ] Prefer no-live baseline smoke before the live call.
- [ ] One bounded proof only (one call / one draft / one send / one bucket roundtrip) unless the approved plan says otherwise.
- [ ] Capture evidence to `$env:TEMP`; scrub secrets before any share.
- [ ] If any secret appears in output: **stop**, redact/remove artifact, consider rotation with owner.

---

## 3. After the session

- [ ] Restore disabled-safe / prior config.
- [ ] Record honest labels (local controlled live vs staging vs production).
- [ ] Propose truth-matrix / STATUS updates only for rows with new evidence (main agent integrates protected files).
- [ ] Confirm Puriva Launch remains **BLOCKED** unless a dedicated launch re-score says otherwise.
- [ ] Confirm production readiness remains **NO** unless a production gate closes.

---

## 4. Refusal card

| Situation | Action |
|---|---|
| No owner sentence for this session | Do not call providers / mutate remote |
| Approval was for staging but command targets production | Refuse |
| Historical G46d/G47 PASS cited as approval | Refuse — not standing authorization |
| Local no-IO foundation cited as live proof | Refuse — see taxonomy L0–L4 |
| Validate failed | Stop; no smoke; no live call |
| Log may contain secrets | Do not paste; redact first |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

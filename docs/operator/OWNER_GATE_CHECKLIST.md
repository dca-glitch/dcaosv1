# Owner Gate Checklist (G652)

**Status:** Compact checklist of decisions that require explicit owner approval. G652 refresh for G469–G708 ultra-block on baseline `66dcb74`. Docs-only; no live execution.

**Hard truths:** local foundations expanding; live proofs deferred; Puriva Launch **BLOCKED**; production frozen (readiness **NO**).

---

## 1. Always separate approvals

| Action | Needs its own approval |
|---|---|
| Live integration proof session | Yes — before session |
| Staging VPS / Docker / Caddy / DNS / migration | Yes — fresh each time |
| Production dry-run formal G49 closure sentence | Yes — owner sentence |
| Production deploy (G50) | Yes — after G49 |
| Commit | Yes — after validation/proof review |
| Push | Yes — separate from commit |
| Deploy / merge to production path | Yes — never implied |
| G469+ launch-blocker execution (e.g. R2 target-bucket) | Yes — before any live IO |

---

## 2. Environment gates

| Gate | Owner must approve |
|---|---|
| G4 staging request / execution | Staging pack + secrets handling |
| Staging admin bootstrap write mode | Mutation confirmation env |
| Staging remote smokes | Target URL / `DCA_SMOKE_REMOTE_TARGET` |
| G9 environment proof | Exact approval sentence in G9 gate doc |
| G49 formal closure | Owner-approval sentence |
| G50 production deploy | Explicit deploy approval |
| G469 first launch-blocker selection | Owner picks candidate (default R2) before execution |

---

## 3. Integration live gates (examples)

| Integration | Approval before |
|---|---|
| R2 real bucket | First live IO |
| OpenRouter / AI text (staging/target) | First bounded call |
| Resend / email send | First send to allowlisted recipient |
| GA/GSC OAuth + sync | Consent + live sync |
| WordPress live draft | First HTTP draft create |
| WordPress publish | Separate from draft; usually deferred |
| Image provider live | First generate |

---

## 4. Docs / process gates

| Item | Owner role |
|---|---|
| Editing protected main docs (`STATUS`, deferred register, truth matrix, Puriva launch, `G708_NEXT_GATES`) | Main-agent integrate after proposal review |
| Claiming Puriva Launch movement | Only after launch re-score with evidence |
| Lifting production freeze language | Only with production readiness YES evidence |
| Treating local foundations as launch proof | Refuse — local ≠ launch |

---

## 5. This lane confirmation

G649–G660 operator lane + PRE-STAGING Lanes 14–15:

- Did **not** obtain or claim live-proof approval.
- Did **not** commit, push, or deploy.
- Did **not** run full `validate` or smoke (docs-scoped `git diff --check` only).
- Left production freeze and Puriva Launch **BLOCKED** unchanged.
- Left `.cursor/settings.json` untracked / untouched (`??` observed).
- **Next stage** remains owner-approved staging/live proof only — not implied by local foundations.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

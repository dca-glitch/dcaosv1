# Owner Gate Checklist (G423)

**Status:** Compact checklist of decisions that require explicit owner approval. Docs-only for G409–G428.

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
| Editing protected main docs (`STATUS`, deferred register, truth matrix, Puriva launch) | Main-agent integrate after proposal review |
| Claiming Puriva Launch movement | Only after launch re-score with evidence |
| Lifting production freeze language | Only with production readiness YES evidence |

---

## 5. This lane confirmation

G409–G428 security/operator lane:

- Did **not** obtain or claim live-proof approval.
- Did **not** commit, push, or deploy.
- Left production freeze and Puriva Launch **BLOCKED** unchanged.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

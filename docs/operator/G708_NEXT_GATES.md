# G708 — Next Gates Roadmap (G709+)

> **Superseded (2026-07-13):** Live GA4/GSC scope **WITHDRAWN** — not next gate. Historical GA/GSC sequencing below is planning context only.

**Status:** Published by main agent after G469–G708 ultra-block integration closeout on 2026-07-10.

**Hard truths (current):**

- **G469–G707 local/no-IO foundations are integrated** across 20 lanes.
- **Live proofs remain deferred** until a separately approved execution gate.
- **Puriva Launch: BLOCKED**
- **Production: frozen**

**Does not authorize:** live IO, commit, push, deploy, or launch.

**Scope:** Conceptual gates **after G708**. G469–G707 covered ultra-block local foundations; G685–G708 covered deferred-register cleanup, truth-matrix/Puriva/STATUS refresh, and this roadmap handoff. **Live proof execution has not run** and must not be assumed complete.

**Context sources:**

- `docs/STATUS.md` (G708 integration closeout 2026-07-10)
- `docs/operator/deferred-scope-register.md`
- `docs/runbooks/PURIVA_LAUNCH_GATE.md`
- `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`
- `docs/operator/G468_NEXT_50_GATES.md` (historical G469+ plan)
- `docs/operator/NEXT_GATE_EXECUTION_CHECKLIST.md`
- Lane closeouts under `docs/runbooks/*_CLOSEOUT.md` and `docs/operator/*_CLOSEOUT.md`

---

## Guardrails

- Keep all live proofs deferred until a separately approved execution gate.
- Local/no-IO foundations from G89–G707 do **not** satisfy Puriva Launch.
- Do not promote local-only proof to staging, production, provider-cost, or client-facing readiness.
- Puriva Client-Service Launch remains separate from DCA OS Production v1 Gate (G49/G50).
- Owner approval required before each execution gate; commit/push/deploy remain separate approvals.
- Validation column = proposed minimum, not already-passed proof.

## Sequencing intent (lowest blast radius first)

1. Owner selects first post-G708 launch blocker (default: R2).
2. Storage real-bucket proof unlocks document/image byte paths.
3. Notification persistence before any live email claim.
4. Target-environment AI re-proof separate from local G77b/G79.
5. ~~GA/GSC OAuth/token storage implementation~~ — **WITHDRAWN** (not in scope).
6. WordPress staging draft proof only after §6.3–§6.5 gap decisions.
7. Image provider selection/disabled-safe wiring before live image proof.
8. Client Portal staging browser proof.
9. Puriva launch re-score (expect still BLOCKED until all criteria close).
10. Production G49/G50 remains a separate frozen track.

---

## Recommended G709 launch-blocker shortlist (owner picks one)

| Rank | Candidate | Why first | Blast radius | Depends on |
|------|-----------|-----------|--------------|------------|
| 1 | **R2 target-environment real-bucket proof** | Unlocks docs + image bytes; plan freeze already local-complete (G469) | Medium | Staging/target bucket + owner approval |
| 2 | Notification persistence / inbox MVP (local) | Unblocks transactional notification path without live send | Medium (schema) | Design gate + migration approval |
| 3 | Target-env AI bounded re-proof | Required for Puriva AI claim beyond local G77b | High (cost) | Staging AI plan + budget cap |
| 4 | ~~GA/GSC token storage implementation~~ | **WITHDRAWN** — live GA4/GSC not in scope | N/A | N/A |
| 5 | WordPress §6.3–§6.5 gap decisions | Unblocks staging live draft session | Medium | Product/schema decisions |
| 6 | SEC-H1 storageKey non-exposure close | Production safety before G50 | High (security) | Code + validation |
| 7 | Image provider research/selection | Unblocks Article+Image live path | High (cost/policy) | Medical-aesthetic policy |
| 8 | G49 formal owner sentence | Production track clarity (not Puriva) | High (process) | Owner only |
| 9 | Client Portal staging browser proof | Needed for approval UX claim | High (staging) | Staging app access |
| 10 | Bounded transactional email live-send | Only after inbox MVP | High (reputation) | Inbox + allowlist recipient |

**Default recommendation for G709:** owner selects **R2 target-bucket proof** (execute live IO against owner-approved target bucket per `STORAGE_R2_PROOF.md` §3) unless already closed under separate owner approval.

---

## Risk-ranked next proof gates

| Risk band | Theme | Examples |
|-----------|-------|----------|
| Low | Docs refresh, owner selection, local residual helpers | G709 selection, residual no-live polish from PARTIAL lane items |
| Medium | R2 live plan execution prep, notification schema design approval, WP gap decisions | R2 checklist freeze→execute, inbox MVP design gate, WP §6.3–§6.5 |
| High | Live provider/storage/email/Google/WordPress/image, staging browser, G49/G50 | Any live IO; staging/prod mutation; deploy |

---

## Next ~100 gates (conceptual bands)

| Band | Gates (conceptual) | Theme |
|------|--------------------|-------|
| A | G709–G720 | Owner selection + R2 live proof execution + evidence capture |
| B | G721–G740 | Notification persistence/inbox MVP (schema-gated) + no-send→live email prep |
| C | G741–G760 | Target-env AI re-proof + trusted `actualCostUsd` ingestion design→impl |
| D | G761–G780 | ~~GA/GSC OAuth token storage impl + bounded read-only sync~~ — **WITHDRAWN** |
| E | G781–G800 | WordPress staging live draft + publish remains frozen |
| F | G801–G820 | Image provider selection + disabled-safe wiring + R2 image bytes |
| G | G821–G840 | Client Portal staging browser + approval UX evidence |
| H | G841–G860 | Puriva launch re-score + remaining product workflow gates |
| I | G861–G880 | Production G49 formal closure + G50 prep (separate track) |
| J | G881–G908 | Residual polish, second-client/SaaS-later (still deferred), audit follow-ups |

Bands are planning aids only. Owner may reorder. No band authorizes work without a separate approved gate.

---

## No-live remaining local work (safe residuals)

- Close any PARTIAL serializer/contract seams called out in lane closeouts (without live IO).
- SEC-H1 admin `storageKey` non-exposure hardening (local code + tests).
- Residual UI truth-badge wiring only if owner scopes a tiny web block.
- Keep stale-claim hygiene when editing docs.

## Live-proof prerequisites matrix

| Proof | Prerequisites | Owner approval |
|-------|---------------|----------------|
| R2 real bucket | Target bucket + `STORAGE_R2_PROOF.md` §3 checklist | Yes |
| Live email | Inbox MVP + allowlist recipient + Resend key in target env | Yes |
| GA/GSC live | **WITHDRAWN** — not in scope | N/A |
| WP live draft | §6.3–§6.5 decisions + staging site | Yes |
| Image live | Provider selection + R2 image bytes + compliance gate | Yes |
| Staging AI | Budget cap + staging plan + restore procedure | Yes |

## Owner approval matrix

| Action | Separate explicit approval required |
|--------|-------------------------------------|
| Start live proof gate | Yes |
| Schema / migration | Yes |
| Commit | Yes |
| Push | Yes |
| Deploy / staging mutation / prod | Yes |

## Validation matrix for next gates

```powershell
cd C:\dcaosv1
git status --short --branch
git diff --check
```

When code changes:

```powershell
npm.cmd run validate
```

Rules: no smoke after failed validate; no live smokes without owner approval; PowerShell one command per line; `.cursor/settings.json` remains untracked.

---

## Explicit non-claims

- G469–G708 did **not** execute live R2, email, Google, WordPress, image, or staging/prod proofs.
- Local G77b OpenRouter proof remains **local only**.
- Puriva Launch remains **BLOCKED**.
- Production remains **frozen**.

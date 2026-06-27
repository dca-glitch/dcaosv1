## Scope summary

<!-- One sentence describing what this PR changes and why. -->

## Files changed

<!-- Exact list of files added or modified. -->

-

## App / runtime changes

- [ ] Yes - describe below
- [ ] No

<!-- If yes, describe what changed and why it is safe. -->

## Backend / schema / provider changes

- [ ] Yes - describe below
- [ ] No

<!-- If yes: schema fields, migrations, API contracts, or provider config changed. -->

## Validation results

```
git diff --check:
npm.cmd run validate:
```

## Smoke results

```
smoke:ai-delivery-reviews:
smoke:local:
smoke:browser:
```

<!-- If any smoke was skipped, state why. -->

## Execution and model policy

- Execution mode used: <!-- Local Copilot CLI / GitHub cloud agent / Planner only / Reviewer only -->
- Budget class: <!-- Low / Medium / High -->
- Model/budget policy followed: <!-- Auto/default / Strong model approved / Cloud agent approved -->
- Strong model used? <!-- Yes - reason: ___ / No -->
- Cloud agent used? <!-- Yes / No -->
- Max files limit respected? <!-- Yes / No - explain if no -->
- Broad repo search avoided? <!-- Yes / No - explain if no -->

## Screenshots

<!-- Only include if UI changed and a screenshot is available. Skip otherwise. -->

## Risk notes

<!-- Anything that could break, needs follow-up, or is deferred. -->

## No-deploy confirmation

- [ ] No deployment has occurred and none is triggered by merging this PR.

---

## Reviewer decision

- [ ] **KEEP** - safe to merge with human approval
- [ ] **FIX** - small correction needed before merging
- [ ] **REVERT** - undo this block; reason:
- [ ] **STOP** - unsafe; do not merge; reason:

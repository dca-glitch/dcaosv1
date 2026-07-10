# Next Gate Proposal — UI Lane

**From:** G429–G448 UI/UX closeout  
**Date:** 2026-07-10

## Recommendation

**Next UI gate (docs/polish):** **UX-P1** — WorkflowBriefs operator empty copy (single file, copy-only).

**If owner prefers structural prep:** **UX-P14** — AI Delivery types extract only (`ai-delivery-types.ts`), zero behavior change.

**Do not** schedule launch-blocker board implementation or AiDelivery Phase C modal splits until UX-P1/P11/P12 and/or Phase A are done.

## Parallel (non-UI)

Owner-selected launch-blocker execution remains **G229+** per [`G227_NEXT_30_GATES.md`](../operator/G227_NEXT_30_GATES.md) (default: R2 target-bucket proof planning). UI lane does not authorize that work.

## Gate template (suggested)

```text
GATE: UX-P1 | mode: frontend copy-only | scope: WorkflowBriefsPage empty copy
max files: 1 | forbidden: App.tsx, design-system, client-portal, api, prisma
validation: git diff --check; npm run -w @dca-os-v1/web check
commit: only after explicit approval | push: separate approval
```

## Success criteria

- Operator-facing empty copy (no “via API or seed data”)  
- Mentions submit-before-run-ai / cockpit path  
- No live/staging overclaim  
- Check passes

# AI Delivery Module Rules

## Product model

The AI Delivery module is **admin-operated MVP**.

- Admin controls all workflow runs.
- Client sees final deliverables only - in a later portal phase.
- No autonomous or background AI agents that incur cost unless explicitly scoped per block.

## Content flow

```
project/brief
  -> content plan
    -> content draft
      -> image planning / manual refs
        -> deliverable package
          -> internal handoff
```

- Keep the admin-only copy accurate.
- Do not claim publication, client delivery, or export unless the relevant phase has been explicitly implemented and scoped.

## Deferred - do not implement unless explicitly scoped

| Feature | Status |
|---|---|
| Client Portal | Deferred |
| WordPress publishing | Deferred |
| Google Docs / PDF export | Deferred |
| Image provider / generation / upscaling | Deferred |
| Google Analytics / Search Console integration | Deferred |
| Public client approval links | Deferred |
| Autonomous background agents | Deferred |

## Preserved structures - do not change unless explicitly scoped

- `AI_WORKFLOW_RESULT_V1` schema/type - preserve as-is
- Cost guardrails and input guardrails - preserve as-is

## Platform neutrality

Content deliverables must remain platform-neutral.

- Do not design schema, API fields, or UI labels that assume WordPress as the target.
- Future export targets may include: WordPress, Next.js/React, headless CMS, Markdown/MDX, JSON packages, Google Docs, PDF.
- Do not hard-code any single publishing destination as the primary model.

## Scope creep prevention

If a block touches the AI Delivery module:

- Check that it does not silently enable a deferred feature.
- Check that it does not add WordPress-specific fields to shared schema.
- Check that it does not add cost-incurring calls without explicit approval.
- Report any drift from admin-MVP model in the final report risk notes.

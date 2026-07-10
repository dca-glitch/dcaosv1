# Remaining UI Blockers (G429–G448)

**Status:** Operator/UI blockers only. Does not clear Puriva Launch or production G49/G50.

## UI / UX polish blockers (local admin)

| ID | Blocker | Severity | Owner lane |
|----|---------|----------|------------|
| UX-P1 | WorkflowBriefs developer-facing empty copy | Medium | Frontend polish |
| UX-P3/P4 | AI Delivery seven primaries / no suggested next | Medium | Frontend polish |
| UX-P5/P15 | Shared Loading/Error on AI Delivery + monthly panel | Low | Frontend polish |
| UX-P11/P12 | Cockpit empty CTAs + static step badges | Medium | Frontend polish |
| AD-6 | `AiDeliveryPage.tsx` monolith (~5.7k lines) | High (process) | Hotspot Phase A+ |
| CP-1–CP-3 | Portal empty/copy consistency | Low–Med | Lane 6 |
| UXP-A1–A3 | Approval image reject/undo / IMAGES_PENDING smoke gaps | Medium (test) | Smoke owner |

## Copy / trust blockers

| ID | Blocker | Notes |
|----|---------|-------|
| COPY-1 | Residual risk of live overclaim on future admin strings | Mitigated by vocabulary + `looksLikeLiveOverclaim` |
| COPY-2 | Cockpit static “Complete” on step 7 | Misleading progress — UX-P12 |

## Out of UI-lane scope (do not “fix” here)

- R2 / email / GA/GSC / WP live / image provider launch blockers  
- Notification persistence  
- package.json smoke aliases  
- App.tsx new routes for launch-blocker board  

## Cleared / improved this gate

- Monthly report FINAL + metrics empty copy now states Client Portal timing and deferred GA/GSC.  
- Proof-state vocabulary documented + unit-tested helper.

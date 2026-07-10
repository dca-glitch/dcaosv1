# Puriva Client Operating Pack v1

**Status:** Canonical architecture — first Client Operating Pack  
**Client:** Puriva (`puriva.id`)  
**Audience:** Product owner, operators, implementers, AI agents  

**Gate separation:** Puriva Client-Service Launch Gate is **separate** from DCA OS Production v1 Gate. Puriva cannot launch until its blockers below are clean.

**Canonical rule:** This document is the single source of truth for Puriva launch blockers, article/image workflow, monthly report flow, and feedback learning. Implementation gates and runbooks link here; they do not duplicate these flows.

**G124-G127 / G209-G216 implementation note:** Puriva's typed pack constants live in `packages/shared/src/client-operating-packs.ts` and are exported from `@dca-os-v1/shared` (via existing `export * from "./client-operating-packs"`). They define the compliance profile + validator, entitlement matrix, workflow template catalog, and client-visibility helpers only; they do **not** execute workflows, call live providers, enforce portal auth, or turn Puriva into a Core fork.

**SaaS-later truth (G214):** Puriva Operating Pack v1 is **Agency OS first**. Typed pack scaffolding is **not** multi-tenant SaaS readiness, self-serve client onboarding, or productized SaaS billing.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [`CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md) | Approved domain/client architecture; Puriva is MVP 1 |
| [`../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md) | Local/admin go/no-go checklist (closed scope) |
| [`../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) | Intake, compliance, brand voice, verified facts |
| [`../runbooks/PURIVA_CONTENT_PRODUCTION_V1_GATE.md`](../runbooks/PURIVA_CONTENT_PRODUCTION_V1_GATE.md) | Content draft scaffold implementation gate |
| [`../runbooks/PURIVA_IMAGE_PACKAGE_V1_GATE.md`](../runbooks/PURIVA_IMAGE_PACKAGE_V1_GATE.md) | Image package scaffold implementation gate |
| [`../runbooks/PURIVA_MONTHLY_REPORT_V1_GATE.md`](../runbooks/PURIVA_MONTHLY_REPORT_V1_GATE.md) | Monthly report scaffold implementation gate |
| [`../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md) | Client portal safety boundary proof |
| [`../ai-delivery/client-delivery-readiness.md`](../ai-delivery/client-delivery-readiness.md) | MVP delivery readiness closure |
| [`../operator/client-delivery-sop.md`](../operator/client-delivery-sop.md) | Plain-language admin/client delivery SOP |

---

## Puriva launch blockers

Puriva cannot launch client service until each blocker below is resolved and proven. Grouped for operator tracking; order does not imply implementation sequence.

### Live integrations and proof

| Blocker | Notes |
|---------|-------|
| GA/GSC live proof | Live analytics sync and reporting proof |
| R2/storage live proof | Live object storage read/write proof |
| Live AI text proof | Live provider execution for article/narrative generation |
| Image generation provider research | Provider selection and policy research |
| Image generation staging proof | Staged image generation proof before client use |
| Transactional notification proof (in-system + email) | Both channels proven for client-facing events |
| WordPress draft/handoff readiness | Draft/handoff package path proven end-to-end |
| Integration health visibility | Admin-visible health for connected integrations |

### AI model and policy gates

| Blocker | Notes |
|---------|-------|
| AI Model Research Gate | Model selection research complete |
| AI Model Policy | Approved model policy for Puriva workloads |

### UX and operating readiness

| Blocker | Notes |
|---------|-------|
| Client Portal approval UX | Client article and image approval flows |
| Task-oriented admin UX | Admin task-oriented workflow surfaces |
| Admin operating checklist | Repeatable admin operating checklist |

### Client profiles and boundaries

| Blocker | Notes |
|---------|-------|
| Medical compliance profile | Puriva medical/compliance boundaries locked |
| Content/tone profile | Brand voice and content tone profile |
| Image profile/boundaries | Image style, subject, and safety boundaries |
| Image dimension profile | Required dimensions for hero, inline, social |

### Workflow and learning (defined in this doc)

| Blocker | Notes |
|---------|-------|
| Puriva Article + Image Package Workflow v1 | See workflow section below |
| Puriva Monthly Report Flow v1 | See monthly report section below |
| Basic feedback learning layer | Per-client learning from reject reasons |
| Admin-visible learning notes/preferences | Admin-only preference storage and display |

---

## Puriva Article + Image Package Workflow v1

Canonical end-to-end workflow for one article deliverable with image package.

### Steps

1. Article draft generated
2. Admin article review
3. Client article approval
4. System generates image package: 1 hero, 2 distinct supporting/inline images
5. Admin image review
6. If admin rejects: reason required, system regenerates rejected image
7. Admin-approved images go to client
8. Client image review
9. If client rejects: reason required, admin notified, system regenerates rejected image
10. Approved images upscaled
11. System generates social preview from hero
12. Admin final package approval
13. WordPress draft/handoff package created
14. Feedback updates Puriva learning layer

### Rules

- **Reject reason required** — every admin or client rejection must include a reason.
- **Regenerate only rejected images** — unless the full package is rejected.
- **Upscale only after approval** — no upscale before client (and admin) image approval.
- **Social preview from hero** — social preview is derived from the approved hero image.
- **Social preview admin final check** — social preview is included in admin final package approval; no separate client approval step for social preview.
- **WordPress draft/handoff only after final package approval** — no handoff before step 12 passes.

---

## Puriva Monthly Report Flow v1

Canonical monthly report delivery workflow.

### Steps

1. Admin selects date range
2. System pulls GA/GSC data
3. System generates report
4. AI may generate narrative/insights/recommendations
5. Metrics/trends from GA/GSC or approved source only
6. Admin reviews report
7. Admin may reject/revise AI narrative with reason
8. Admin approves final report
9. System sends client: in-system + email notification
10. Final report appears in Client Portal

### Rules

- **No client approval/reject/comments/request changes** — client receives the final report only.
- **Client receives final report only** — no draft or in-review report in Client Portal.
- **AI cannot invent metrics** — all metrics and trends must come from GA/GSC or another approved source.

---

## Feedback learning layer

Per-client learning that improves regeneration and long-term preferences without weakening compliance.

### Scope

- **Per-client first** — learning is scoped to Puriva before any cross-client generalization.
- **Admin-only learning notes** — clients do not see learning notes or preference internals.
- **Covers:** articles, images, monthly report narrative.

### Behavior

- **Reject reason required** — rejections feed the learning layer.
- **Immediate regeneration uses feedback** — the next regeneration for a rejected item uses the reject reason.
- **Long-term preference only after repeated pattern or admin approval** — persistent preferences require a repeated pattern or explicit admin approval.
- **Compliance boundaries cannot be weakened** — learning cannot relax medical, legal, or image-boundary rules.
- **Advanced analytics deferred** — learning analytics beyond basic notes/preferences are out of scope for v1.

---

## Typed constants closeout (G124-G127)

Puriva Operating Pack v1 now has shared typed configuration for the parts that were previously doc-only:

| Gate | Constant | Scope |
|------|----------|-------|
| G124 | `PURIVA_COMPLIANCE_PROFILE_V1` | Compliance risk classes, human review requirements, article/image client approval requirements, monthly report final-only rule, prohibited claim categories, immutable compliance boundaries |
| G125 | `CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG.puriva` | Pack-level module entitlement map (expanded in G210) |
| G126 | `PURIVA_WORKFLOW_TEMPLATE_CATALOG` | Catalog-only workflow templates (expanded in G212) |

These constants are intentionally pack configuration. They do not replace `Client`, `TenantModule`, workflow runtime, portal auth, or publication/integration services. DCA OS Lite remains **Internal Agency OS first**; Puriva is the first pack layered on generic Core/modules, not a fork.

---

## G209-G216 pack hardening closeout

| Gate | Artifact | Scope |
|------|----------|-------|
| G209 | `PURIVA_OPERATING_PACK_V1` / `CLIENT_OPERATING_PACK_CONFIGS` | Hardened assembled pack config + version constants |
| G210 | `PURIVA_MODULE_ENTITLEMENTS` | Entitlement matrix: AI Workflow, AI SEO, Monthly Reports, Client Portal, WordPress Draft, Image Generation, GA/GSC, Notifications, Market Intelligence, Revenue Hub, POD Toolkit, Finance Lite — statuses `enabled` / `partial` / `future` |
| G211 | `validatePurivaComplianceProfile` | Medical content required; website/social only; paid ads `future_out_of_scope`; admin review required |
| G212 | `PURIVA_WORKFLOW_TEMPLATE_CATALOG` | SEO article, image set, WordPress draft, monthly report, market intelligence, revenue insight, POD listing (+ legacy Article+Image composite); all `catalog_only`, no execution |
| G213 | `isClientVisiblePackSurface` / `getClientVisiblePackModuleKeys` | Pure helpers: client sees only entitled + active (`enabled`/`partial`) surfaces |
| G214 | `CLIENT_OPERATING_PACK_SAAS_READINESS` | Explicit `saas_later` label — Agency OS first, not SaaS-ready |
| G215 | This doc + [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md) | Puriva docs closeout for pack hardening |
| G216 | `apps/api/src/core/client-operating-packs.test.ts` | Focused shared/API tests for the above |

### Entitlement matrix (configuration truth only)

| Module | Status | Client-visible surface | Required for launch |
|--------|--------|------------------------|---------------------|
| Core | enabled | no | yes |
| AI Workflow | enabled | no | yes |
| AI SEO | enabled | no | yes |
| Monthly Reports | partial | yes | yes |
| Client Portal | enabled | yes | yes |
| WordPress Draft | partial | no | yes |
| Image Generation | partial | yes | yes |
| GA/GSC | future | no | yes |
| Notifications | future | no | yes |
| Market Intelligence | enabled | no | yes |
| Revenue Hub | future | no | no |
| POD Toolkit | future | no | no |
| Finance Lite | enabled | no | no |

Runtime tenant/module enforcement, live providers, and portal auth are **not** changed by these constants.

---

## Local/admin closed scope (reference)

Local/admin-operational closeout (intake, scaffolds, draft-only WordPress, client-safe archive, local E2E proof) is documented in [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md). That closeout does **not** clear the launch blockers above and does **not** authorize production, staging, live provider, live WordPress publish, GA/GSC, or R2 work.

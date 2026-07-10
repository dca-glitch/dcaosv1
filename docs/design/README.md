# docs/design

Design handoff documentation for the DCA OS Lite redesign.  
Source: Figma Make session — July 2026.  
Repository: `dca-glitch/dcaosv1`

---

## Purpose

This directory bridges the approved Figma Make visual prototypes and the functional source of truth in this repository. It records every approved visual decision, component specification, and the phased redesign plan so that implementation can proceed with full fidelity to the approved direction.

---

## Document Index

| File | Contents |
|------|----------|
| [FIGMA_SOURCE.md](./FIGMA_SOURCE.md) | Figma Make source link, approval date, approved references, revision notes |
| [DESIGN_SYSTEM_SPEC.md](./DESIGN_SYSTEM_SPEC.md) | Color tokens, typography, spacing, surfaces, components, states, status system, accessibility |
| [REDESIGN_ROLLOUT_PLAN.md](./REDESIGN_ROLLOUT_PLAN.md) | 13-phase implementation sequence with dependencies, preserved behavior, risks, acceptance criteria |
| [MODAL_PATTERNS.md](./MODAL_PATTERNS.md) | AI Run Review modal and Deliverable Approval modal — structure, states, actions, accessibility |
| [SCREEN_REFERENCE.md](./SCREEN_REFERENCE.md) | Agency Operations Dashboard, AI Delivery Dashboard, Client Portal Dashboard |
| [assets/README.md](./assets/README.md) | Preview image index and export status |

---

## Source of Truth Rules

### Figma Make is the visual source of truth
All color values, spacing decisions, component structure, elevation, typography scale, status system, and visual language are defined in the approved Figma Make prototypes and documented in this directory.

### This repository is the functional source of truth
All routes, data models, API contracts, business logic, workflow state machines, permissions, authentication behavior, and database schema are defined in the application code and must not be altered by the visual redesign.

### These two sources must not conflict
If a visual decision requires a data or API change, that change must be separately scoped, reviewed, and approved before implementation begins.

---

## Implementation Boundaries

### Must never change during visual redesign
- Database schema and Prisma migrations
- API route contracts and response shapes
- Authentication and session behavior (including Turnstile)
- Business logic and workflow state machines
- Permission and role rules
- Secrets and environment configuration
- Existing test coverage and CI workflows

### May change during visual redesign
- React component markup and Tailwind class usage
- CSS custom properties in `apps/web/src/styles/theme.css`
- Component file structure within `apps/web/src/components`
- Icon usage (lucide-react named imports)
- Font loading in global CSS

---

## Generated Code Policy

Figma Make generates React code alongside visual prototypes. This generated code:

- **Must not be pushed directly to `apps/`** without a separate implementation review
- **Must be verified** for functional parity with the existing screen before merging
- **Must be checked** for API contract compliance, permission regression, and business logic integrity
- **Serves as visual specification**, not production-ready code

Every implementation PR that touches an existing screen must include a checklist confirming no regressions in routes, data, permissions, or business logic.

---

## Approved References (do not redesign)

These five artifacts are approved and must be used as visual references for all subsequent implementation work. They must not be redesigned.

1. **Agency Operations Dashboard** — admin density reference, ring meter KPI tiles, workflow tabs
2. **AI Delivery Dashboard** — numeric KPI tiles, pipeline bar, action queue, deliverables table
3. **Client Portal Dashboard** — client density reference, simplified stages, plain language
4. **AI Run Review Modal** — tabbed modal, progressive disclosure, admin-only
5. **Deliverable Approval Modal** — checklist-gated approval, client-safe

See [SCREEN_REFERENCE.md](./SCREEN_REFERENCE.md) and [MODAL_PATTERNS.md](./MODAL_PATTERNS.md) for full specifications.

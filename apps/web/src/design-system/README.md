# DCA OS Lite — Design System

## Status

This directory contains canonical low-level design-system implementation and showcase material.
`Layout.tsx` is dormant/showcase-only. The live shell is under `apps/web/src/components/shell/`.
Application code should normally use public components from `apps/web/src/components/ui/`.

## Authority chain

1. `docs/design/DESIGN_SYSTEM_SPEC.md`
2. `tokens.css`
3. `design-system/components/`
4. compatibility adapters under `components/ui/`

## Live configuration

`apps/web/tailwind.config.ts` is the only live web Tailwind configuration.
No duplicate config belongs in this directory.

## Component policy

- Reuse an existing canonical component first.
- Application code imports through `components/ui`.
- Thin adapters are allowed for compatibility.
- Do not introduce a fourth component system.
- Do not perform broad mechanical migrations without a bounded approved task.
- Do not change semantic status meaning merely for visual consistency.

## Adding or changing components

1. Confirm no canonical component already exists.
2. Update the low-level design-system component.
3. Update or preserve the public adapter.
4. Add focused tests.
5. Run the component import guard and full validation.

## Visual direction

Quiet Command Center is dark, calm, premium, operational, restrained indigo, and readable.
Prefer fewer unnecessary borders and cards.
Avoid neon AI styling, glassmorphism, oversized marketing layouts, and tiny text used to simulate density.

## Important token rule

`#6366F1` is part of the current canonical primary token system unless the canonical specification and tokens are intentionally changed together.
Do not remove or replace it based on this README.

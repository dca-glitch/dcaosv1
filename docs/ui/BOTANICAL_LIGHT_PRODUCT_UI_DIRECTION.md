# Botanical Light Product UI Direction

**Status:** current UI authority for DCA OS Lite
**Current proof baseline:** merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`)

## 1. Authority rule

Botanical Light is the active product UI direction. Dark Nebula is historical only.

If an older audit, mockup, rulebook, or screenshot pack conflicts with the current routed-page implementation and Botanical Light tokens, Botanical Light wins.

## 2. Canonical tokens

| Role | Value | Source |
|---|---|---|
| Canvas / page background | `#E9E9E4` | `apps/web/src/design-system/tokens.css` |
| Primary surface / panel | `#F1F1ED` | `apps/web/src/design-system/tokens.css` |
| Graphite primary CTA | `#30343B` | `apps/web/src/design-system/tokens.css` |
| Indigo accent | `#3730A3` | `apps/web/src/design-system/tokens.css` |
| Font family | `Plus Jakarta Sans` | `apps/web/src/design-system/tokens.css` |
| Structural radius | `0px` | `apps/web/src/design-system/tokens.css` |
| Fields / buttons / status radius | `3px` | `apps/web/src/design-system/tokens.css`, `apps/web/tailwind.config.ts` |

## 3. Botanical Soft status families

Use the existing token families rather than inventing new state palettes:

- **neutral:** draft / archived
- **attention:** ready / in review / awaiting client
- **in progress:** active workflow work
- **positive:** approved / completed / published
- **problem:** changes requested / failed / overdue
- **blocked:** blocked or dependency-held work

These token families are defined in `apps/web/src/design-system/tokens.css`.

## 4. Density and container rules

- Admin/operator surfaces default to **compact** density.
- Client-facing surfaces default to **comfortable** density.
- Tables support both **compact** and **comfortable** modes through the shared table components.
- Containers stay sharp/flat rather than rounded marketing cards.
- Avoid neon, glassmorphism, decorative gradients, and tiny fake-density typography.

## 5. Interaction rules

- Complex workflows should use **routed pages** rather than deep modal stacks.
- Keep **short confirmation** and other **single-purpose overlays** as modals where they remain the clearest and safest interaction.
- Frontend terminology stays **English-only**.
- Client-safe surfaces must preserve the existing admin/client boundary.

## 6. Proof baseline at `998c294` / `PR #55`

| Proof | Result |
|---|---|
| Web unit tests | **362/362 PASS** |
| AI Delivery routed deep links | **85/85 PASS** |
| System-wide responsive route proof | **124/124 PASS** |
| Genuine Client-role Botanical proof | **98/98 PASS** |
| Responsive viewports | **1440 / 768 / 390** |

`PR #55` / merge commit `998c294` is the canonical modal-to-page and genuine Client-role Botanical proof baseline.

## 7. Sources

- `apps/web/src/design-system/tokens.css`
- `apps/web/tailwind.config.ts`
- `apps/web/src/design-system/components/Table.tsx`
- `apps/web/src/components/shell/PageContainer.tsx`
- `PR #55` / merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b`

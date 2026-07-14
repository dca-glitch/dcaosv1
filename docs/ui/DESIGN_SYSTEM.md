# DCA OS Lite — Design System Specification (BLOK 7-UI)

> **Warning:** This is superseded historical/proposal material. It is not the implemented production design system and must not be used as implementation authority. If this document conflicts with current implementation evidence, the current implementation takes precedence.

**Status:** Superseded historical proposal — no production implementation authority
**Audience:** Piotr (validation), frontend implementers  
**Related:** [`DARK_NEBULA_PRODUCT_UI_DIRECTION.md`](./DARK_NEBULA_PRODUCT_UI_DIRECTION.md), [`admin-data-dense-ui.md`](./admin-data-dense-ui.md)

This document defines the **target** visual language for BLOK 7-UI. It refines the approved Dark Nebula direction toward a **compact, operator-first navy + muted teal** palette. HTML/CSS mockups live in [`mockups/`](./mockups/) for side-by-side review before React implementation.

Current authority chain:

1. [`docs/design/DESIGN_SYSTEM_SPEC.md`](../design/DESIGN_SYSTEM_SPEC.md)
2. [`apps/web/src/design-system/tokens.css`](../../apps/web/src/design-system/tokens.css)
3. [`apps/web/src/design-system/components/`](../../apps/web/src/design-system/components/)
4. public compatibility adapters under [`apps/web/src/components/ui/`](../../apps/web/src/components/ui/)

Where this proposal conflicts with current implementation evidence, the implementation evidence wins.

---

## 1. Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1a2942` | Primary buttons, key accents, active nav |
| `primary-hover` | `#243552` | Primary button hover |
| `accent` | `#4a8a99` | Focus rings, links, info badges |
| `accent-bright` | `#5a9db5` | Hover accents, selected states |
| `background` | `#0a1118` | App shell, page background |
| `background-alt` | `#0d1520` | Deep panels, sidebar |
| `surface` | `#1a2847` | Cards, section panels, inputs |
| `surface-raised` | `#222f47` | Elevated panels, table headers |
| `border` | `#333333` | Dividers, input borders |
| `border-subtle` | `rgba(255,255,255,0.08)` | Glass-style panel edges |
| `text` | `#e0e6eb` | Primary body text |
| `text-muted` | `#8b949e` | Secondary labels, meta |
| `text-dim` | `#6e7681` | Placeholders, disabled |
| `success` | `#3fb950` | Success badges, confirmations |
| `success-bg` | `rgba(46,160,67,0.15)` | Success badge background |
| `error` | `#f85149` | Errors, destructive text |
| `error-bg` | `rgba(218,54,51,0.15)` | Error badge background |
| `warning` | `#d29922` | Warnings, pending states |
| `warning-bg` | `rgba(158,106,3,0.18)` | Warning badge background |
| `info` | `#5a9db5` | Informational badges |
| `info-bg` | `rgba(74,138,153,0.18)` | Info badge background |

**Contrast:** Body text on `background` must meet WCAG AA (4.5:1). Muted text is for non-critical meta only.

**Dark Nebula note:** Nebula gradients and glass effects may appear at **shell level** (sidebar, login). Data surfaces inside pages stay flat and scannable per admin-data-dense rules.

---

## 2. Spacing scale (4px base)

| Token | Value | Typical use |
|-------|-------|-------------|
| `xs` | 4px | Label-to-field gap, badge padding |
| `sm` | 8px | Inline gaps, compact chip padding |
| `md` | 12px | Row vertical padding, form gaps |
| `lg` | 16px | Section padding, row horizontal padding |
| `xl` | 24px | Panel padding, section gaps |
| `2xl` | 32px | Page section separation |
| `3xl` | 48px | Major layout breaks |

---

## 3. Typography

**Font stack (no web fonts):**

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
```

**Mono stack** (IDs, codes, technical values):

```css
font-family: ui-monospace, "Cascadia Code", "Segoe UI Mono", Consolas, monospace;
```

| Role | Size | Weight | Line-height | Use |
|------|------|--------|-------------|-----|
| Display | 24px | 600 | 32px | Page titles |
| Heading | 18px | 600 | 24px | Section headers, panel titles |
| Subheading | 14px | 600 | 20px | Field labels, column headers |
| Body | 14px | 400 | 20px | Paragraphs, table cell text |
| Small | 12px | 400 | 16px | Timestamps, helper text, badge labels |
| Mono | 12px | 400 | 16px | Record IDs, API keys (display only) |

**Rules:**

- One Display per page surface; avoid duplicate page-level titles.
- Section descriptions use Body + `text-muted`.
- Do not go below 12px for readable UI copy.

---

## 4. Button hierarchy

### Variants

| Variant | Background | Border | Text | Hover |
|---------|------------|--------|------|-------|
| Primary | `primary` | none | `#ffffff` | `primary-hover` |
| Secondary | transparent | 1px `text-dim` | `text` | `surface` bg |
| Tertiary / Ghost | transparent | none | `text-muted` | `surface` bg |
| Destructive | transparent | none | `error` (muted) | brighter `error` |
| Disabled | — | — | `text-dim` | no hover |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 28px | 8px 12px | 13px |
| `md` | 36px | 12px 16px | 14px |
| `lg` | 44px | 16px 24px | 14px |

**Rules:**

- **One primary** per surface (page header, modal footer, sticky action bar).
- Row actions: one visible primary (`Open`, `Review`) + kebab `More` for secondary.
- Destructive actions stay text-only or inside menus until confirmed.
- Border radius: 6px (buttons), 4px (sm chips).

---

## 5. Badge styles

**Status badge:** height 20px, 11px uppercase or sentence-case text, horizontal padding 8px, border-radius 4px.

| Variant | Background | Text | Example labels |
|---------|------------|------|----------------|
| Success | `success-bg` | `success` | Approved, Final, Active |
| Error | `error-bg` | `error` | Rejected, Failed |
| Warning | `warning-bg` | `warning` | Pending, Awaiting approval |
| Info | `info-bg` | `info` | Draft, In review |
| Neutral | `rgba(139,148,158,0.15)` | `text-muted` | Archived, Inactive |

Badges are **small and low-saturation** — scannable in tables, not decorative pills.

---

## 6. Table / list row

| Property | Value |
|----------|-------|
| Row height | 44px minimum (icon + label + badge + action) |
| Padding | 12px vertical, 16px horizontal |
| Border | 1px `border` bottom divider |
| Hover | background +2% lighter than `surface` |
| Alignment | Left: names, titles, text · Right: numbers, currency, dates |

**Row action pattern:**

```
[ Status badge ]  Title + meta                    [ Primary ]  [ ⋮ ]
```

- No 3–4 visible buttons per row.
- Secondary: Edit, Archive, Export → kebab menu.

**Dense list variant** (Client Portal, admin overviews): same row rules inside `SectionPanel` without full table chrome.

---

## 7. Form field

| Property | Value |
|----------|-------|
| Input height | 36px (single-line) |
| Textarea | min-height 80px, same horizontal padding |
| Padding | 8px 12px |
| Background | `background-alt` or `surface` |
| Border | 1px `#444444` |
| Border radius | 6px |
| Focus | 2px solid `accent` outline (offset 0) |
| Label | Subheading, `margin-bottom: 4px` |
| Label → field gap | `xs` (4px) |
| Field → next field | `md` (12px) vertical in stacked forms |

**States:**

| State | Treatment |
|-------|-----------|
| Default | Border `#444`, text `text` |
| Placeholder | `text-dim` |
| Disabled | `text-dim`, `opacity: 0.6`, no focus ring |
| Read-only | No border change; optional `surface-raised` bg |
| Error | Border `error`; do not rely on color alone |
| Error message | Small (12px), `error`, `margin-top: 4px` |
| Helper text | Small (12px), `text-muted`, `margin-top: 4px` |

**Select / datetime:** same height and padding as text input.

---

## 8. Layout & shell

### App shell

| Region | Width / behavior |
|--------|------------------|
| Sidebar | 240px fixed; collapsible to 56px icon-only (future) |
| Main content | `flex: 1`, max-width 1280px centered optional |
| Page padding | `xl` (24px) desktop, `lg` (16px) mobile |

### Page header

```
Eyebrow (Small, muted)     [optional actions right]
Display title
Body description (muted)
[ optional filter row ]
```

### Section panel

- Background: `surface`
- Border: 1px `border-subtle`
- Border radius: 8px
- Padding: `lg`–`xl`
- Heading + one-line description + optional inline actions

### Client Portal subnav

Horizontal tabs below page header: Archive | Pending Approvals (with count badge).

---

## 9. Modal & sticky actions

| Element | Rule |
|---------|------|
| Overlay | `rgba(0,0,0,0.6)` |
| Panel | `surface-raised`, 8px radius, max-width 560px (forms) / 720px (wide) |
| Footer | Primary right; Cancel/secondary left; consistent order |
| Sticky footer bar | Article approval: Save & Continue, Submit approval, Reject article |

---

## 10. Empty, loading, error states

| State | Pattern |
|-------|---------|
| Empty | Heading + muted message + optional single CTA |
| Loading | Inline label "Loading…" or skeleton rows (44px) |
| Error | `error` title + message + Retry ghost button |

Keep notices **compact** — no oversized warning panels on every screen.

---

## 11. Icons & misc

- Icon size in rows: 16px; in buttons: 16–18px
- Kebab menu: 24×24 hit target
- Divider: 1px `border`
- Focus visible: always show focus ring for keyboard users

---

## 12. Mockups for review

Open in browser (file:// or local static server):

| # | File | Screen |
|---|------|--------|
| — | [`mockups/index.html`](./mockups/index.html) | Mockup index |
| 1 | [`mockups/01-admin-clients-list.html`](./mockups/01-admin-clients-list.html) | Admin — Clients overview (data-dense) |
| 2 | [`mockups/02-client-pending-approvals.html`](./mockups/02-client-pending-approvals.html) | Client Portal — Pending Approvals |
| 3 | [`mockups/03-article-approval-editor.html`](./mockups/03-article-approval-editor.html) | Client Portal — Article approval editor |
| 4 | [`mockups/04-client-portal-archive.html`](./mockups/04-client-portal-archive.html) | Client Portal — Archive overview |

**Puriva sample data** is used in client mockups for realistic review context.

---

## 13. Implementation gate

1. Piotr validates this spec + mockups.
2. Only then: implement tokens in `apps/web` (CSS variables / shared components).
3. No backend, API, auth, schema, or route changes as part of UI-only pass.

**GATE:** KEEP after validation → frontend implementation block; REVERT if palette or density direction rejected.

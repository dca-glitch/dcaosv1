> **Superseded historical design spec.** This file preserves earlier redesign details and is not the current implementation authority. Current UI authority is [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](../ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md).

# DCA OS Lite — Design System Specification

Version 1.0 · July 2026  
Extracted from three approved dashboards, two approved modals, and the Design System reference page.

---

## 1. Foundations

### 1.1 Color Roles

All values are exact hex codes. No opacity variants in the accent palette — opacity is applied contextually as noted.

```
A.primary  #6366F1   Primary — CTAs, active states, brand
A.indigo   #818CF8   Indigo — in-progress badges, accents, interactive
A.sage     #4CAF85   Sage — approved, completed, success, healthy
A.teal     #4CAFC0   Teal — published, live content
A.amber    #C98A42   Amber — in review, attention, warning
A.coral    #E07070   Coral — blocked, failed, overdue, urgent, error
A.mauve    #A07AC8   Mauve — awaiting client, scheduled, pending external
```

### 1.2 Background and Surface Levels

Seven-level elevation system. All surfaces are solid — no glassmorphism.

```
L.page     #06070D                  Page background — outermost canvas       z-0
L.sidebar  #04050A                  Sidebar / nav — darker than page          z-10
L.surface  #08090F                  Table headers, inset areas, code blocks   z-10
L.panel    #0C0F1A                  Primary card / panel color                z-20
L.hover    #111525                  Row and item hover state                  z-30
L.div      rgba(255,255,255,0.06)   Divider lines, section separators         —
L.border   rgba(255,255,255,0.08)   Card and panel borders                    —
L.borderS  rgba(255,255,255,0.11)   Strong border — overlapping surfaces      —
```

### 1.3 Page Background

Three radial corner glows over a base linear gradient:

```css
background:
  radial-gradient(ellipse 70% 50% at 0% 0%, #120820 0%, transparent 60%),
  radial-gradient(ellipse 55% 40% at 100% 100%, #0E0620 0%, transparent 55%),
  radial-gradient(ellipse 40% 30% at 60% 40%, #0A051A 0%, transparent 65%),
  linear-gradient(160deg, #06070D 0%, #09060F 50%, #06070D 100%);
```

### 1.4 Text Hierarchy

```
T.primary    #E2E6F2   Headings, KPI values, active labels, titles
T.secondary  #9BA3BF   Body copy, descriptions, row text
T.muted      #7F89A8   Column headers, helper text, labels, small uppercase
T.faint      #3A4060   Timestamps, mono data, divider labels, least important
```

**Rule:** All 9px uppercase tracking labels use `T.muted`, not `T.faint`. `T.faint` is reserved for timestamps and mono data only. Runtime token: `--ds-text-muted: #7F89A8` (Wave 2 Option B; do not document the retired `#5C6380`).

### 1.5 Panel CSS Helper

Every card and panel uses this helper. Never use plain background colors on cards.

```ts
function panelCSS(tint?: string, raised = false): CSSProperties {
  const base = 'linear-gradient(135deg, #06070D 0%, #0D0818 100%)';
  const bg = tint
    ? `radial-gradient(ellipse 200% 120% at -5% -5%, ${tint}09 0%, transparent 50%), ${base}`
    : base;
  return {
    background: bg,
    border: `1px solid rgba(255,255,255,0.08)`,
    boxShadow: raised
      ? '0 4px 16px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.03) inset'
      : '0 1px 4px rgba(0,0,0,0.30)',
  };
}
```

- `tint`: optional accent hex — adds a subtle radial glow at top-left. Use for action-required panels only.
- `raised: true`: adds elevation shadow. Use on all content cards.

### 1.6 Spacing Scale

4px grid. Tailwind utility classes.

```
p-1   4px    Component micro-spacing
p-2   8px    Tight internal padding
p-3   12px   Standard internal padding
p-4   16px   Admin card padding, table cell padding
p-5   20px   Client card padding
p-6   24px   Client table cell padding, large card padding
p-7   28px   Admin page gutter
p-8   32px   Client page gutter
```

### 1.7 Grid and Layout Rules

```
Sidebar width:         220px fixed
Topbar height:         52px fixed
Admin page gutter:     px-7 (28px)
Client page gutter:    px-8 (32px)
Admin section gap:     space-y-4
Client section gap:    space-y-6
KPI grid:              grid-cols-6 (both admin and client)
Two-col split:         1fr / 240–280px (main + narrow aside)
Two-col equal:         grid-cols-2
Asset grid (client):   grid-cols-4
Card gap:              gap-3 (admin) / gap-4 (client)
```

### 1.8 Corner Radius Scale

```
rounded        4px     Inline code pills, stage tags, checkboxes
rounded-lg     8px     Buttons, small interactive elements, nav items
rounded-xl     12px    Cards, panels, dropdowns, modals, side sheets
rounded-2xl    16px    Modal container
rounded-full   9999px  Status badges, priority dots, avatars, pills
```

### 1.9 Border Styles

```
Card border:   1px solid rgba(255,255,255,0.08)   All panels and cards
Divider:       1px solid rgba(255,255,255,0.06)   Rows, section separators
Border strong: 1px solid rgba(255,255,255,0.11)   Dropdowns overlapping cards
Accent border: 1px solid {color}28                Badge borders
Top accent:    2px solid {stageColor}             Pipeline stage cards with attention
```

### 1.10 Elevation Levels

```
Flat:    0 1px 4px rgba(0,0,0,0.30)                                               Default panel
Raised:  0 4px 16px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.03) inset       Content cards
Overlay: 0 16px 48px rgba(0,0,0,0.70)                                             Dropdowns, notification panels
Modal:   0 32px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.03) inset    Modal containers
Glow:    0 2px 10px rgba(99,102,241,0.30)                                         Primary CTA buttons
```

### 1.11 Icon Treatment

- Library: `lucide-react` — named imports only.
- Nav icon (inactive): `size={13}`, `opacity: 0.45`
- Nav icon (active): `size={13}`, `opacity: 0.85`
- KPI tile icon (standard): `size={13}`, `opacity: 0.45`
- KPI tile icon (alert): `size={13}`, `opacity: 0.90`
- Button icon: `size={10}` or `size={11}`
- Section/report header: `size={18}`
- Always add `flexShrink: 0` on icons inside flex containers.

### 1.12 Focus States

```css
box-shadow: 0 0 0 2px rgba(99,102,241,0.40);
```

Applied on `:focus-visible` for all interactive elements. Never remove focus outlines — only replace with the ring token.

### 1.13 Motion Principles

- Row/item hover: `transition-colors` (Tailwind default, ~150ms)
- Button opacity: `hover:opacity-80` or `hover:opacity-90`
- Ring meter arc: `transition: stroke-dashoffset 0.5s ease`
- Table row action reveal: `opacity-0 group-hover:opacity-100 transition-opacity`
- Refresh icon: `animate-spin` (Tailwind)
- **No** bounce, spring, or page-transition animations — this is a work tool
- **No** animated gradients, shimmer effects, or neon pulse
- Keep all transitions under 200ms for interactive elements

---

## 2. Typography

### 2.1 Font Stack

```css
--font-family-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
```

Google Fonts import:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Rejected fonts:** Space Grotesk (overused in SaaS), Satoshi (unavailable), Orbitron (too stylised).

### 2.2 Type Scale

| Role | Size | Weight | Color | Font | CSS |
|------|------|--------|-------|------|-----|
| Page title | 22px | 600 | T.primary | Sans | `text-[22px] font-semibold` |
| Section title | 18px | 600 | T.primary | Sans | `text-[18px] font-semibold` |
| Topbar title | 14px | 600 | T.primary | Sans | `text-[14px] font-semibold` |
| Card title | 13px | 600 | T.primary | Sans | `text-[13px] font-semibold` |
| Body / row | 12px | 500 | T.primary | Sans | `text-[12px] font-medium` |
| Body secondary | 11px | 400 | T.secondary | Sans | `text-[11px]` |
| Label / caption | 11px | 400 | T.muted | Sans | `text-[11px]` |
| Column header | 9px | 700 | T.muted | Sans | `text-[9px] font-semibold uppercase tracking-[0.10em]` |
| Section label | 9px | 700 | T.muted | Sans | `text-[9px] font-semibold uppercase tracking-[0.12em]` |
| Badge text | 10px | 500 | varies | Sans | `text-[10px] font-medium` |
| Timestamp / mono | 10px | 400 | T.faint | Mono | `text-[10px] font-mono` |
| Stage tag (inline) | 10px | 400 | T.muted | Mono | `text-[10px] font-mono` |
| KPI numeric | 26px | 600 | T.primary | Mono | `text-[26px] font-semibold font-mono` |
| Ring center value | 15px | 600 | accent | Mono | `text-[15px] font-semibold font-mono` |
| Button text | 11px | 600 | varies | Sans | `text-[11px] font-semibold` |
| Tooltip / code | 10px | 400 | A.indigo | Mono | `text-[10px] font-mono` |

---

## 3. Semantic Status System

One canonical STATUS map. All components derive color, background, and border from it. Never define ad hoc status colors.

### 3.1 Status Map

| Key | Label | Text | Background | Border |
|-----|-------|------|------------|--------|
| `draft` | Draft | `#7880A0` | `rgba(120,128,160,0.10)` | `rgba(120,128,160,0.16)` |
| `ready` | Ready | `#818CF8` | `rgba(129,140,248,0.10)` | `rgba(129,140,248,0.17)` |
| `in_progress` | In Progress | `#818CF8` | `rgba(129,140,248,0.10)` | `rgba(129,140,248,0.17)` |
| `in_review` | In Review | `#C98A42` | `rgba(201,138,66,0.10)` | `rgba(201,138,66,0.17)` |
| `awaiting_client` | Awaiting Client | `#A07AC8` | `rgba(160,122,200,0.10)` | `rgba(160,122,200,0.17)` |
| `changes_requested` | Changes Requested | `#E07070` | `rgba(224,112,112,0.10)` | `rgba(224,112,112,0.17)` |
| `approved` | Approved | `#4CAF85` | `rgba(76,175,133,0.10)` | `rgba(76,175,133,0.17)` |
| `completed` | Completed | `#4CAF85` | `rgba(76,175,133,0.10)` | `rgba(76,175,133,0.17)` |
| `published` | Published | `#4CAFC0` | `rgba(76,175,192,0.10)` | `rgba(76,175,192,0.17)` |
| `blocked` | Blocked | `#E07070` | `rgba(224,112,112,0.10)` | `rgba(224,112,112,0.17)` |
| `failed` | Failed | `#E05050` | `rgba(224,80,80,0.10)` | `rgba(224,80,80,0.17)` |
| `overdue` | Overdue | `#E06060` | `rgba(224,96,96,0.12)` | `rgba(224,96,96,0.22)` |
| `archived` | Archived | `#7F89A8` | `rgba(127,137,168,0.09)` | `rgba(127,137,168,0.16)` |

### 3.2 Client-Safe Status Vocabulary

Client Portal must use these simplified labels instead of internal status keys:

| Internal key | Admin label | Client label |
|---|---|---|
| `draft` | Draft | Planning |
| `in_progress` | In Progress | In Production |
| `in_review` | In Review | Ready for Review |
| `awaiting_client` | Awaiting Client | Awaiting Your Response |
| `approved` | Approved | Approved |
| `completed` | Completed | Delivered |
| `published` | Published | Published |
| `archived` | Archived | Archived |
| `blocked` | Blocked | *(hidden — show contact prompt)* |
| `failed` | Failed | *(hidden — show contact prompt)* |
| `changes_requested` | Changes Requested | *(hidden — show gentle prompt)* |

### 3.3 Color Semantics

| Color | Statuses | Meaning |
|-------|----------|----------|
| Indigo | `ready`, `in_progress` | Active, moving forward |
| Amber | `in_review` | Needs a decision |
| Mauve | `awaiting_client`, `scheduled` | Waiting on external party |
| Sage | `approved`, `completed` | Positive resolution |
| Teal | `published` | Live / public |
| Coral | `blocked`, `failed`, `overdue`, `changes_requested` | Needs urgent action |

### 3.4 Status Rules

- Use `overdue` only when past due date — not just delayed.
- Coral statuses must always be paired with a visible required action.
- Never add new status colors — map new states to existing palette.
- Never expose `failed`, `blocked`, or raw job IDs to clients.

---

## 4. Components

### 4.1 Buttons

| Variant | Background | Text | Border | Shadow | Use |
|---------|-----------|------|--------|--------|-----|
| Primary | `linear-gradient(135deg, #6366F1, #4F46E5)` | `#fff` | none | glow | Create, Submit, Approve |
| Secondary | `L.panel` | `T.secondary` | `L.border` | none | Download, Preview, Cancel |
| Ghost | transparent | `T.muted` | transparent | none | Close, tertiary |
| Titanium | `linear-gradient(160deg, #1A1A1F, #0F0F14, #0A0A0E)` | `#9A9AA8` | `rgba(255,255,255,0.10)` | dark | Continue (ops) |
| Tinted | `{color}10` | `{color}` | `{color}28` | none | Contextual: coral=destructive, amber=warning |
| Destructive | `rgba(224,112,112,0.10)` | `#E07070` | `rgba(224,112,112,0.22)` | none | Flag, Delete |

**Rules:**
- All buttons: `rounded-lg`. No pill-shaped buttons.
- One primary button per content section maximum.
- Table row action buttons: `opacity-0 group-hover:opacity-100`.
- Hover: `hover:opacity-80` on secondary. Primary preserves glow.
- Disabled: `opacity-40 cursor-not-allowed`.

### 4.2 Status Badges vs generic Badge

**Product imports (canonical):** `StatusBadge`, `ClientStatusBadge`, `Badge` from `components/ui`.

| Primitive | Use for | Do not use for |
|-----------|---------|----------------|
| `StatusBadge` | Admin-facing lifecycle / workflow status | Categories, filters, static tags, proof-state maturity |
| `ClientStatusBadge` / portal adapter | Client-safe lifecycle labels (hidden keys stay hidden) | Admin enums that must not leak |
| `Badge` (tone variants) | Category, filter, metadata, operational chips | Business lifecycle status color |

```tsx
import { StatusBadge, Badge } from "../components/ui";

// status = semantic key / enum (color + data-status); displayLabel = visible text only
<StatusBadge status="AWAITING_CLIENT" displayLabel="Sent to Client" />

// Non-status metadata stays on Badge
<Badge variant="neutral">Deferred</Badge>
```

**Rules:**
- Always `rounded-full` for status pills. Never solid filled.
- Always derive color from the STATUS map / `--status-*` tokens — never define inline status colors.
- Never use a translated display string as the tone source.
- Proof-state (evidence maturity) is admin-only and separate from workflow status — do not invent a second status primitive for it without an owner gate.
- Stage tags (inline in tables): `rounded` (square corners), mono font, surface bg.

### 4.3 KPI Tiles

Two variants:

**Numeric variant** (AI Delivery + Client Portal):
```
Label (9px uppercase)  →  Icon (13px, right)
Numeric value (26px mono)  →  Helper text (11px)
```

**Ring Meter variant** (Agency Operations only):
```
Label (9px uppercase)
Helper text (11px)
RingMeter SVG (50×50px, 2.5px stroke)
  → Center value (15px mono)
```

**Alert treatment:** When `alert=true`, apply accent color to numeric value AND icon opacity 0.90.

### 4.4 Ring Meter SVG

```tsx
<svg width="50" height="50" viewBox="0 0 50 50"
  style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
  <circle cx="25" cy="25" r={20} fill="none"
    stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
  <circle cx="25" cy="25" r={20} fill="none" stroke={color}
    strokeWidth="2.5" strokeLinecap="round"
    strokeDasharray={circ} strokeDashoffset={off}
    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
</svg>
```

- No glow, no filter, no shadow on the SVG.
- Used only on Agency Operations Dashboard.
- Client Portal must never show ring meters.

### 4.5 Tables

**Product API (import from `components/ui` only):**

| When | Use |
|------|-----|
| Straightforward headers → cells | Simple `Table` adapter |
| Expandable rows, custom cell trees, compound markup | `CompoundTable` + `TableHead` / `TableBody` / `CompoundTableRow` / `Th` / `Td` / `TdDouble` |
| Page-number controls | `TablePaginationBar` (not DS `TablePagination` from pages) |

**Responsive policy (Wave 4):**

* Preserve semantic `<table>` with a single intentional horizontal scrollport.
* Product `.table-wrap` uses `overflow-x: auto` (never card-style `overflow: hidden`).
* Prefer `aria-label` on the `Table` / `<table>`, not only on an unlabeled div.
* Labeled scroll regions may expose `role="region"` + `tabIndex={0}` so keyboard users can focus the scrollport.
* Do not convert tables to cards solely for mobile preference.

**Visual tokens:**

```
Header row:   background: L.surface  |  border-bottom: L.div  |  9px font-semibold uppercase T.muted
Data row:     hover background: L.hover  |  border-bottom: L.div  |  12px font-medium T.primary
Action cell:  prefer always-visible product actions; DS Td `actions` opacity-0 is unused in product routes
```

**Admin density:** `px-4 py-2.5`  
**Client density:** `px-6 py-3.5`

No zebra striping. Hover is the only row highlight.

### 4.5.1 Table-state composition

Prefer existing public state components **instead of** the table (or inside the surrounding `SectionPanel`), not as invalid nodes inside `<tbody>`:

* loading → `LoadingState`
* true empty / filtered empty → `EmptyState` with correct `kind`
* fetch failure → `ErrorState`

Do not invent a second table framework.
### 4.6 Panels and Cards

All panels use `panelCSS()`. PanelHeader pattern:

```tsx
<div className="px-5 py-3.5 flex items-center justify-between gap-4"
  style={{ borderBottom: `1px solid ${L.div}` }}>
  <h2 className="text-[13px] font-semibold" style={{ color: T.primary }}>{title}</h2>
  {aside}
</div>
```

### 4.7 Charts

**Bar chart (Client Portal):**
- Latest bar: full indigo gradient
- Previous bars: `rgba(129,140,248,0.20)` fill
- Hover tooltip: panel bg, 1px border, 9–10px mono, no arrow

**Progress bar (status distribution):**
- Height: 3px
- Track: `rgba(255,255,255,0.05)`
- Fill: accent color at 70% opacity

**Rules:**
- No pie, donut, or radar charts
- No recharts axes by default — operational clarity preferred

### 4.8 Modals

See [MODAL_PATTERNS.md](./MODAL_PATTERNS.md) for full specification.

**Shell:**
```css
border-radius: 16px;
border: 1px solid rgba(255,255,255,0.13);
background: linear-gradient(150deg, #09090F 0%, #0E0B1C 100%);
box-shadow: 0 32px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.03) inset;
```

### 4.9 Toasts

Use `sonner`. Toast colors:
- Success: sage (`#4CAF85`)
- Warning: amber (`#C98A42`)
- Error: coral (`#E07070`)

### 4.10 Dropdowns and Tooltips

**Dropdown:** `border: L.borderS`, large drop shadow `0 16px 48px rgba(0,0,0,0.70)`, `rounded-xl`.

**Tooltip:** Panel bg, 1px border, 9–10px mono, no caret/arrow.

---

## 5. Component States

| State | Treatment |
|-------|-----------|
| Default | Panel bg, border, muted text. No highlight. |
| Hover | Background → `L.hover`. Text → `T.secondary`. |
| Focus | `box-shadow: 0 0 0 2px rgba(99,102,241,0.40)`. |
| Active | Slightly darker background. Brief. |
| Selected | Indigo 10% bg, `#A5B4FC` text. No left border. |
| Disabled | `opacity: 0.40`. `cursor-not-allowed`. No interaction. |
| Loading | Product: `LoadingState` (`role="status"`, polite live region; `page` or `inline`). Control-only spinner remains valid with its own accessible label. |
| Empty | Product: `EmptyState` with kinds `empty` \| `no-results` \| `filtered` \| `first-use` (`data-empty-kind`). Distinguish true-zero / first-use from filtered/search empties. Inline may be message-only. No error tone. |
| Success | Sage icon + message. Toast or inline confirmation. |
| Warning | Amber icon + message. Attention panel tint. |
| Error | Product data failures: `ErrorState` (Alert danger + optional recovery). Form validation / action toasts stay on Alert/Toast — not page ErrorState. Deferred/disabled/withdrawn capabilities are **not** ErrorState. |
| Overdue | Coral text on due date cell only. No row background change. |

---

## 6. Admin vs Client Density Rules

| Property | Admin surfaces | Client Portal |
|----------|---------------|---------------|
| Page gutter | `px-7` (28px) | `px-8` (32px) |
| Section gap | `space-y-4` | `space-y-6` |
| Card padding | `p-4` | `p-5–6` |
| Table cell padding | `px-4 py-2.5` | `px-6 py-3.5` |
| KPI tile | Ring meter or numeric | Numeric only |
| Status vocabulary | Internal + client labels | Client-safe labels only |
| Table columns | 8–10 (operator context) | 5–7 (essential only) |
| Internal metadata | Visible (job IDs, tokens, timings) | Hidden — never exposed |
| Stage names | All 10 workflow stages | Planning / In Production / Ready for Review / etc. |
| Chart complexity | Pipeline bar, status distribution | Simple traffic bars + top content |

---

## 7. Accessibility Principles

- WCAG AA minimum: 4.5:1 for body text, 3:1 for large text.
- All interactive elements keyboard-accessible with visible focus ring.
- Modals and side sheets: focus trapped, Escape closes, focus returns to trigger.
- All icons inside buttons have `aria-hidden="true"` with accessible button label.
- Status badges use role + aria-label when color is the only differentiator.
- Skip-to-content link at top of shell.
- Screen reader announces KPI values with context (not just the number).

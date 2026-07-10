# Screen Reference — Approved Dashboards

Three approved dashboard screens for DCA OS Lite.  
Version 1.0 · July 2026

These screens are the visual reference standards for the full product redesign. Do not redesign them. Use them as fixed targets for all implementation work.

---

## 1. Agency Operations Dashboard

**Route:** `#/` (Daily Cockpit)  
**Surface:** Admin only  
**Approval:** July 2026  
**Reference for:** Admin density, ring meter KPI tiles, workflow tab pattern, activity feed

### Purpose

Gives the admin operator a complete view of all active deliverables across client projects. The primary daily workflow tool — opened first, checked constantly.

### Layout

```
Topbar: "Daily Cockpit" · date · client filter · refresh

KPI Row (6 tiles — ring meter variant):
  Blocked · Overdue · In Review · Ready · In Progress · Completed

Workflow Tabs: Ready Now | In Review | Blocked
  ↳ Deliverable cards per tab (status badge, client, project, due, actions)

Agency Health Row:
  Clients · Active Projects · Overdue Items

Activity Feed (admin — full internal stage names)
```

### KPI Tiles — Ring Meter Variant

- Structure: Label → Helper text → RingMeter SVG (stacked vertical)
- No icons in ring tiles
- Ring arc color reflects status (coral for blocked/overdue, amber for in-review, etc.)
- Center value: 15px mono font, same color as arc
- Tint: `panelCSS(accentColor, true)` — subtle radial glow

### Workflow Tabs

- Three tabs: Ready Now / In Review / Blocked
- Active tab: indigo underline 1.5px
- Each tab shows deliverables filtered to that status
- Deliverable card: client + project name, deliverable title, status badge, priority dot, due date, action buttons

### Continue Button

Black titanium treatment — darker than secondary buttons:
```css
background: linear-gradient(160deg, #1A1A1F 0%, #0F0F14 50%, #0A0A0E 100%);
color: #9A9AA8;
border: 1px solid rgba(255,255,255,0.10);
box-shadow: 0 2px 8px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06);
```

### Activity Feed (Admin Variant)

- Shows internal stage names (e.g., "PH-D03 moved to Internal Review")
- Shows project references in mono
- Dot + spine timeline layout
- Most recent first

### Density

- Page gutter: `px-7` (28px)
- Section gap: `space-y-4`
- Card padding: `p-4`
- Admin density throughout — maximum information per viewport

### What Must Be Preserved

- All data fetching and API endpoints (unchanged)
- Tab routing logic (ready / review / blocked URL params or hash)
- Deliverable status update actions from cards
- Client and project associations
- Permission check (admin-only route)

---

## 2. AI Delivery Dashboard

**Route:** `#/ai-delivery`  
**Surface:** Admin only  
**Approval:** July 2026  
**Reference for:** Numeric KPI tiles, workflow pipeline bar, action queue, deliverables table, status distribution

### Purpose

Gives the admin a complete operational view of the AI content delivery workflow — from brief to published. Answers: what stage is everything at, what needs action, and what is complete.

### Layout

```
Topbar: "AI Delivery" · date range · client filter · refresh · Create Delivery Project CTA

KPI Row (6 tiles — numeric variant):
  Active Projects · Pending Reviews · Client Approvals
  Image Approvals · Reports Awaiting · Overdue Items

Workflow Pipeline Bar (10 stages):
  Brief → Research → Plan → Drafting → Int. Review
  → Images → Client Appr. → WP Draft → Report → Completed

Two-column row:
  Action Required queue  |  Status Distribution panel

Two-column row:
  Approvals panel        |  Workflow Activity feed

Deliverables Table (10 columns)

Footer
```

### KPI Tiles — Numeric Variant

- Structure: Label (top-left) + Icon (top-right) → Numeric value (26px mono) → Helper text
- No ring meters
- Alert tile: accent color on numeric value, icon at full opacity (0.90)

### Workflow Pipeline Bar

- 10 stages in horizontal sequence, left to right
- Each stage: label (9px uppercase) + count (18px mono) + status line
- Attention state: colored top border (2px) matching status color
- Stages with count=0: 40% opacity, "—" for status
- Chevron separators between stages
- Color coding: indigo (active), amber (internal review needed), mauve (client approval), coral (blocked/overdue), sage (complete)

### Action Required Queue

- Columns: Priority dot | Client/Project | Deliverable/Required Action | Stage | Due/Owner | Waiting | Action
- Priority dot: coral (high), amber (medium), muted (low)
- Action button: hidden by default, revealed on row hover (`opacity-0 group-hover:opacity-100`)
- Action button color matches priority color
- Tinted panel: coral tint (`panelCSS(A.coral, true)`)

### Deliverables Table

10 columns: Client | Project | Deliverable | Stage | Status | Owner | Client Review | Due Date | Last Update | Next Action

- Admin density: `px-4 py-2.5`
- Hover: `L.hover` background
- No zebra striping
- Status column: DeliveryBadge component
- Stage column: mono stage tag (square pill)
- "Awaiting — pending" in Client Review column: mauve text

### What Must Be Preserved

- All workflow stage transitions and business rules
- AI run trigger and polling logic
- Content draft versioning
- Image upload and approval flow
- Internal review assignment logic
- Client approval submission logic
- All API endpoints and data shapes

---

## 3. Client Portal Dashboard

**Route:** `#/client-portal`  
**Surface:** Client only  
**Approval:** July 2026  
**Reference for:** Client density, simplified delivery stages, plain language, calmer layout

### Purpose

Gives the client a clear, calm view of: what needs their approval, what is in progress, what has been delivered, what is live, and how their content is performing. Simpler and less dense than the admin dashboards.

### Layout

```
Topbar: "Client Portal" · Puriva Health · period selector · notifications bell

Page header: Client name (22px) · reporting period · Download Report button

KPI Row (6 tiles — numeric, no rings):
  Active Deliverables · Awaiting Your Approval (alert)
  Approved This Month · Published Content · Final Assets · Latest Report

Required Attention section (amber tint — always first)
  Columns: Deliverable · Type · Submitted · Due · Status · Action CTA

Two-column row:
  Delivery Timeline   |  Updates (notifications)

Two-column row:
  Content Performance |  Top Performing Content

Recent Deliverables table (6 columns)

Final Assets (4-column grid)

Monthly Report banner (full-width)

Footer
```

### Required Attention Section

- Always positioned directly below KPI row
- Amber tint: `panelCSS(A.amber, true)`
- Urgent items: coral dot at row start
- Action button: primary indigo — one clear CTA per row
- Client-safe language: "Review & Approve", not internal action names
- Due dates: coral text when urgent

### Delivery Timeline

- Dot + spine layout (7px dot, colored by stage)
- Client-safe stage names only: Planning / In Production / Ready for Review / Approved / Scheduled / Published / Reported
- Plain English notes: "Awaiting your approval", "Live on your site", "Being produced"
- No internal stage names, job IDs, or technical metadata

### Content Performance

- 6-month bar chart: indigo gradient for latest, 20% indigo for previous months
- Hover tooltip: panel bg, 1px border, session count
- 4 KPI tiles below chart: Organic Sessions, Search Impressions, Search Clicks, Published Articles
- Top content ranking: numbered list with progress bars, views, and change percentage

### Final Assets Grid

4 cards: Published Articles | Approved Images | PDF Reports | WordPress Drafts
- Each card: category + count + file list with download or link icon
- `panelCSS(accent, true)` per category
- Client downloads files directly from this section

### Monthly Report Banner

Full-width panel with indigo tint:
- Report title + status badge
- One-sentence description
- Three actions: Preview | Download PDF | Review & Approve (primary)

### Density

- Page gutter: `px-8` (32px)
- Section gap: `space-y-6`
- Card padding: `p-5–6`
- Table cell padding: `px-6 py-3.5`
- More whitespace than admin — readability priority

### Client Safety Rules

The following must never appear on the Client Portal:
- Internal status keys (blocked, failed, changes_requested)
- AI job IDs, run IDs, or model names
- Token counts or context usage metrics
- Internal notes or admin comments
- Workflow stage names beyond the 7 client-safe stages
- Provider names or technical infrastructure details
- Revenue data or pricing information
- Other clients' data in any form

### What Must Be Preserved

- Client authentication and session isolation
- Permission boundary enforcement at data layer (not just UI)
- Deliverable file URLs and download logic
- Approval submission endpoint and confirmation
- Report PDF generation and delivery
- Client notification triggers
- Historical deliverable archive access

---

## Summary Comparison

| Property | Agency Ops | AI Delivery | Client Portal |
|----------|-----------|-------------|---------------|
| Surface | Admin | Admin | Client |
| KPI style | Ring meter | Numeric | Numeric |
| Density | Max | High | Calm |
| Status vocab | Internal | Internal | Client-safe |
| Page gutter | 28px | 28px | 32px |
| Section gap | 16px | 16px | 24px |
| Table cols | N/A | 10 | 6 |
| Activity feed | Internal | Internal | Notification centre |
| Stage visibility | All 10 | All 10 | 7 client-safe |
| Charts | Ring meters | Pipeline bar | Traffic bars |
| Primary CTA | Continue | Create Delivery Project | Review & Approve |

# Modal Patterns

Two approved modal patterns for DCA OS Lite.  
Version 1.0 · July 2026

Both modals are built from the shared design system and must not deviate from approved visual treatment. Do not redesign these patterns during rollout.

---

## Shared Modal Shell

All modals use this container:

```css
border-radius: 16px;           /* rounded-2xl */
border: 1px solid rgba(255,255,255,0.13);
background: linear-gradient(150deg, #09090F 0%, #0E0B1C 100%);
box-shadow:
  0 32px 80px rgba(0,0,0,0.80),
  0 0 0 1px rgba(255,255,255,0.03) inset;
max-height: 88vh;
overflow: hidden;
```

### Header
- Height: auto, `px-6 py-4`
- Background: `rgba(4,5,10,0.60)`
- Border-bottom: `1px solid L.div`
- Contains: title (14px semibold T.primary) + status badge + close button
- Close button: 28×28px, `rounded-lg`, `L.surface` bg, `L.div` border, X icon 13px

### Footer
- Height: auto, `px-6 py-4`
- Background: `rgba(4,5,10,0.60)`
- Border-top: `1px solid L.div`
- Action hierarchy: destructive (left) → spacer → ghost (close) → secondary → primary

### Body
- `flex-1 overflow-y-auto`
- `px-6 py-5`
- Scrollable content area between header and footer

### Backdrop
- `rgba(3,3,8,0.72)` with `backdrop-filter: blur(2px)`
- Clicking backdrop closes modal
- Escape key closes modal

---

## Modal 1 — AI Run Review

**Purpose:** Let an admin review an AI workflow run and decide what happens next.  
**Surface:** Admin only. Never shown to clients.  
**Width:** 780px

### Structure

```
┌─ Header: "AI Run Review" + status badge + close ─────────────────┐
├─ Tab strip: Overview | Context & Logs | Raw Output ──────────────┤
├─ Body (scrollable) ──────────────────────────────────────────────┤
│   Overview tab:                                                    │
│     ┌──────────────────┐  ┌──────────────────┐                   │
│     │  Run Details     │  │  Result Summary  │                   │
│     │  (metadata grid) │  │  (or error)      │                   │
│     └──────────────────┘  └──────────────────┘                   │
│     Admin Notes (textarea)                                        │
│                                                                    │
│   Context & Logs tab:                                             │
│     Context usage bar (token count + breakdown)                   │
│     Execution log (mono, scrollable)                              │
│                                                                    │
│   Raw Output tab:                                                  │
│     Copy button + raw model output (mono, scrollable)             │
├─ Footer: [Destructive?] ··· [Close] [Secondary] [Primary] ───────┤
└──────────────────────────────────────────────────────────────────┘
```

### Tab Behaviour
- Active tab: `T.primary` text, indigo 1.5px bottom border
- Inactive tab: `T.muted` text
- Tabs persist within the modal session — switching tab does not trigger a data refetch

### Run Details Grid (Overview tab)

| Field | Format |
|-------|--------|
| Client | Plain text |
| Project | Mono font |
| Workflow type | Plain text |
| Deliverable | Plain text |
| Model | Mono font |
| Executed | Mono font — date + time |
| Token estimate | Mono font — used / limit |

Error state: token estimate cell uses coral text when limit exceeded.

### Action Hierarchy

| Position | Action | Variant | Condition |
|----------|--------|---------|----------|
| Left | Flag for Manual Review | Destructive | Error state only |
| Right-1 | Close | Ghost | Always |
| Right-2 | Retry with Shorter Context | Secondary | Error state only |
| Right-2 | Request Changes | Tinted amber | Default + disabled states |
| Right-3 | Approve Run | Primary indigo | All states |

### Progressive Disclosure

- Level 1 (Overview tab): metadata + result summary + admin notes — visible immediately
- Level 2 (Context & Logs tab): token usage breakdown + execution log — on demand
- Level 3 (Raw Output tab): raw model output — on demand

Technical detail is accessible but visually secondary.

### States

| State | Header badge | Body | Footer |
|-------|-------------|------|--------|
| **Default** | In Review | Metadata grid + result summary + notes | Ghost + Request Changes + Approve |
| **Loading** | Running… | Info banner + skeletons | Ghost Cancel + loading Approve |
| **Error** | Error | Error banner + error details in metadata | Destructive flag + Ghost + Retry |
| **Disabled** | In Review | Same as default, textarea + actions locked at 40% opacity | Ghost + disabled Request + disabled Approve |
| **Confirmed** | Approved | Centered sage checkmark + confirmation message + next step | Ghost Close + View Deliverable |

### Error State Detail

When a run has `error` status:
- Error banner at top of body (coral bg, coral border)
- Token estimate cell: coral text, shows `{used}K / {limit}K — exceeded`
- Error code block: `{code} · Step {n}/{total} · {Recoverable|Fatal}`
- Execution log shows error line in normal color (not highlighted)
- Approve is disabled
- Destructive "Flag for Manual Review" appears at far left of footer

### Accessibility

- Focus trapped within modal while open
- Initial focus: first tab button (Overview)
- Escape closes modal, focus returns to triggering element
- Status badge has `aria-label` describing current run status
- Textarea has `aria-label="Admin notes"`
- Close button: `aria-label="Close AI Run Review"`

---

## Modal 2 — Deliverable Approval

**Purpose:** Let an admin or client review a content deliverable and approve or request changes.  
**Surface:** Admin and client (different density, same structure).  
**Width:** 700px

### Structure

```
┌─ Header: "Deliverable Approval" + status badge + close ───────────┐
├─ Metadata bar: Deliverable · Client · Type · Version · Submitted · Due
├─ Tab strip: Preview | Revision History | Comments ────────────────┤
├─ Body (scrollable) ───────────────────────────────────────────────┤
│   Preview tab:                                                      │
│     Image placeholder                                              │
│     Content excerpt + read-full link                               │
│     Approval Checklist (gates Approve button)                      │
│                                                                     │
│   Revision History tab:                                            │
│     Version list (version tag · note · date · author)              │
│                                                                     │
│   Comments tab:                                                     │
│     Comment thread + add comment textarea                           │
├─ Footer: [Close] [Request Changes] [Approve] ─────────────────────┤
└───────────────────────────────────────────────────────────────────┘
```

### Metadata Bar

Shown below header, above tabs. One row of key facts:
- Deliverable name (14px semibold)
- Client
- Type (Article / Report / Image Set / Content Plan)
- Version (v1.0 — mono)
- Submitted date (mono)
- Due date (mono — amber when approaching)

### Approval Checklist

Gates the Approve button. All items must be checked before Approve enables.

Default checklist items:
1. Tone and language match client brand voice
2. Health claims are accurate and appropriately qualified
3. Product mentions are correct and consistent
4. Headings and keywords look natural and relevant
5. All links and references have been reviewed

Checkbox style: 16×16px, `rounded`, border `L.borderS`, checked bg `A.sage`, check icon white.

### Action Hierarchy

| Position | Action | Variant | Condition |
|----------|--------|---------|----------|
| Right-1 | Close | Ghost | Always |
| Right-2 | Request Changes | Tinted amber | Default, disabled states |
| Right-3 | Approve | Primary indigo | Enabled only when all checklist items checked |

No destructive action in this modal — it is client-safe.

### States

| State | Header badge | Body | Footer |
|-------|-------------|------|--------|
| **Default** | Awaiting Client | Metadata bar + tabs | Ghost + Request Changes + Approve (disabled until checklist complete) |
| **Loading** | Running… | Info banner + skeleton | Ghost Cancel + loading Approve |
| **Error** | Error | Error banner + empty state with retry | Ghost Close + Retry |
| **Disabled** | Awaiting Client | Same as default, all inputs and checklist locked at 40% | Ghost + disabled actions |
| **Confirmed** | Approved | Centered sage checkmark + plain language confirmation + download link | Ghost Close |

### Confirmed State (client-facing language)

> "Thank you. The [Deliverable Name] has been approved and will move to scheduling. You will receive a notification when it is live on your website."

Plain English only. No internal stage names.

### Admin vs Client Differences

| Property | Admin view | Client view |
|----------|-----------|-------------|
| Checklist items | All 5 items | All 5 items (same) |
| Status vocabulary | Internal labels | Client-safe labels |
| Comments tab | Shows internal notes if any | Shows client-visible comments only |
| Revision history | Shows all versions + author | Shows versions only (no AI model names) |
| Confirmed message | Operational summary | Plain English / friendly |

### Accessibility

- Focus trapped within modal while open
- Initial focus: first tab button (Preview) or first checklist item
- Escape closes modal, focus returns to triggering element
- Checklist items are `<label>` elements with checkbox inputs — keyboard togglable
- Approve button has `aria-disabled="true"` with tooltip when checklist incomplete
- Close button: `aria-label="Close Deliverable Approval"`

---

## Do and Do Not

### Do
- Reuse the modal shell for all new modals introduced in later phases
- Use progressive disclosure — overview first, details on demand
- Show one primary action at a time in the footer
- Use confirmed state before closing after a successful approval
- Trap focus inside modal while open
- Return focus to the triggering element on close

### Do Not
- Do not add new modal variants without referencing these patterns
- Do not show AI run details, job IDs, or token counts in client modals
- Do not auto-close after confirmation — show confirmed state first
- Do not use modals for destructive confirmations that could use inline actions
- Do not add marketing language or upgrade prompts to any modal
- Do not use centered modals for simple confirmations — use inline toast instead

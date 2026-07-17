> **Historical mockup index.** These assets belong to an earlier redesign reference set and are not the current UI authority. Use [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](../../ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) for the current direction.

# docs/design/assets

This directory is reserved for preview images and visual exports from the approved Figma Make design work.

---

## Export Status

Direct image export from Figma Make to a GitHub repository is not available via the current tooling. Preview images must be exported manually from the Figma Make session and placed in this directory.

---

## Intended Files

The following files should be added to this directory when export becomes available:

| Filename | Content | Source screen |
|----------|---------|---------------|
| `agency-ops-dashboard.png` | Full-viewport screenshot at 1440×900 | Agency Operations Dashboard |
| `ai-delivery-dashboard.png` | Full-viewport screenshot at 1440×900 | AI Delivery Dashboard |
| `client-portal-dashboard.png` | Full-viewport screenshot at 1440×900 | Client Portal Dashboard |
| `design-system-reference.png` | Full-viewport screenshot at 1440×900 | Design System Reference page |
| `modal-ai-run-review-default.png` | Modal in default state on dimmed background | AI Run Review Modal |
| `modal-ai-run-review-error.png` | Modal in error state | AI Run Review Modal |
| `modal-ai-run-review-confirmed.png` | Modal in confirmed state | AI Run Review Modal |
| `modal-deliverable-approval-default.png` | Modal in default state on dimmed background | Deliverable Approval Modal |
| `modal-deliverable-approval-confirmed.png` | Modal in confirmed state | Deliverable Approval Modal |
| `rollout-plan.png` | Full rollout plan page screenshot | Redesign Rollout Plan |
| `status-system.png` | Status system section from Design System reference | Design System Reference |
| `typography-scale.png` | Typography scale section | Design System Reference |

---

## Export Instructions

To export from Figma Make:

1. Open the Figma Make session for DCA OS Lite
2. Navigate to each approved screen
3. Use browser developer tools or a screenshot tool to capture at 1440×900 viewport
4. Save using the exact filenames listed above
5. Add files to this directory and commit to `main`

Alternatively, if Figma Make adds direct asset export in a future release, use that mechanism and update this README to reflect the new export method.

---

## Usage

Once images are available:

- Reference them in `SCREEN_REFERENCE.md` and `MODAL_PATTERNS.md` using relative paths:
  ```markdown
  [Agency Operations Dashboard image path example: `docs/design/assets/agency-ops-dashboard.png`]
  ```
- Do not commit low-resolution or partial screenshots — full viewport at 1440×900 only
- Do not commit screenshots of error states in the application — only approved design states

# Reports Module

## Purpose

The Reports module provides reusable reporting surfaces and monthly report definitions.

## Current state

- admin monthly report shell exists
- metrics snapshot foundation exists
- FINAL-only client portal archive visibility exists
- monthly report document handoff exists
- `storageKey` stays hidden from admin/client outputs
- client report download uses signed/reference flow (`hasDocument` + download reference); `storageKey` is never returned to clients
- **`#/monthly-reports` is a stub UI only** — canonical live client monthly reports are under `#/client-portal` (`ClientPortalPage`)

## Client visibility (FINAL-only)

- Clients see **FINAL, non-archived** monthly reports only via Client Portal project endpoints.
- Report list and detail live in `#/client-portal` (archive shell), not the `#/monthly-reports` stub page.
- Detail may include `workSummary` (deliverables/content-plan work completed) and `performanceSummary` when an approved metrics snapshot exists.
- Metrics are **snapshot-first**: admin import/approve, or manual/Puriva placeholder scaffolding — **not** live GA/GSC OAuth sync.
- Client-safe provenance on `performanceSummary` may include `sourceType`, `manualSource`, `disclaimer`, and normalized totals; raw snapshot records and admin import notes do not cross the client boundary.

## Current scope

- report list
- report metadata
- report detail shell
- AI Delivery monthly summary read model
- AI Delivery monthly report persisted model
- AI Delivery monthly metrics snapshot foundation
- computed trend summaries from approved snapshots
- monthly report PDF generation foundation
- monthly report document handoff

## Deferred

- live GA/GSC sync, Google OAuth, and live analytics provider integration
- scheduled reports
- non-final client-visible reports
- client self-service report actions
- broader export targets beyond the current handoff foundation
- autonomous report generation

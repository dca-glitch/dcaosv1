# Reports Module

## Purpose

The Reports module provides reusable reporting screens and report definitions.

## MVP Scope

- report list
- report metadata
- placeholder report detail
- prepare report parameters
- AI Delivery monthly summary read model (admin-only, schema-free)
- AI Delivery monthly report persisted model (admin-only, `AiDeliveryMonthlyReport`, migration applied)
- AI Delivery monthly metrics snapshot foundation (admin-only, snapshot-first)
- Computed 12-month trend summary from approved monthly metric snapshots
- AI Delivery monthly report admin UI, PDF action, and browser smoke proof
- AI Delivery monthly report PDF generation foundation (admin-triggered, private-storage-backed)
- Client Portal monthly reports archive surface (FINAL-only, browser-proven)
- Monthly Report document handoff (admin upload + admin download + client portal download)
- `storageKey` hidden from all admin and client outputs; only written via upload endpoint
- `hasDocument` boolean flag exposed to admin and client portal; computed from `!!storageKey`
- Local smoke proves: upload → 503 R2_STORAGE_NOT_CONFIGURED, download reference → null, storageKey tightened on PUT

## Deferred

- live GA/GSC provider sync
- Client report approval/actions
- Production deploy

- scheduled reports
- broader/future exports beyond the implemented Monthly Report PDF/document handoff
- non-final client-visible reports and client report self-service actions beyond the implemented Client Portal FINAL-only monthly report archive
- dashboard integration
- AI report summaries

## Backend Areas

- reports route
- reports controller
- reports service
- report registry later

## Frontend Areas

- reports list page
- report detail page
- report parameter form later

## Shared Contracts

- report definition
- report parameter
- report result summary

## Dependencies

- tenant context
- permissions
- dashboard module

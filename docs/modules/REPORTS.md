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

## Future Scope

- scheduled reports
- exports
- client-visible reports
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

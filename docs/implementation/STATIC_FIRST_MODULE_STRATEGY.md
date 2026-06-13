# Static-First Module Strategy

## Purpose

DCA OS v1 should use a static-first strategy for early module foundations.

This means module contracts, routes, and frontend pages can be created before database persistence is ready.

## Why

Static-first modules allow the platform to validate structure, routing, UI, shared contracts, and module registry behavior before adding database complexity.

## Allowed In Static Phase

- shared DTOs
- route foundations
- service foundations
- static demo data
- frontend list pages
- frontend detail placeholders
- module registry entries

## Not Allowed In Static Phase

- database writes
- production data
- migrations
- complex permission enforcement
- deployment assumptions

## Promotion Path

1. static module foundation
2. shared contract validation
3. UI validation
4. API validation
5. database repository added later
6. tenant enforcement added later
7. permissions enforced later

## Rule

Do not block module structure work just because persistence is not ready.

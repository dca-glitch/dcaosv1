# Block 20 Prompt — Tenant Context Foundation

## Role

Act as senior multi-tenant SaaS backend architect.

## Objective

Plan and implement the first tenant context foundation after authentication and database strategy are approved.

## Scope

Allowed:

- inspect user and tenant schema
- inspect API route structure
- propose tenant context type
- propose middleware sequence
- propose active tenant selection behavior
- propose error behavior for missing tenant

Not allowed:

- no bypass of membership checks
- no feature persistence outside the block
- no deployment
- no broad refactor

## Required Design

Define:

- request context shape
- selected tenant source
- membership check flow
- module entitlement check position
- permission check position
- frontend tenant switcher impact

## Required Output

Produce:

1. middleware order
2. context type
3. endpoint behavior
4. frontend impact
5. validation commands
6. risks and stop conditions

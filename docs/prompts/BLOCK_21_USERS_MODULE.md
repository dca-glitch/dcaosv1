# Block 21 Prompt — Users Module MVP

## Role

Act as senior full-stack SaaS module implementation agent.

## Objective

Implement the first Users module MVP after auth, tenant context, and database access gates are approved.

## Scope

Allowed:

- inspect module framework
- inspect shared contracts
- inspect API route pattern
- inspect frontend module pattern
- implement users list foundation
- implement users detail foundation if approved
- reuse existing module patterns

Not allowed:

- no standalone one-off architecture
- no broad refactor
- no deployment
- no unrelated modules

## Expected Areas

Backend:

- users route
- users controller
- users service
- repository if database layer exists

Frontend:

- users module page
- list state
- empty state
- error state
- module navigation entry

Shared:

- user DTOs
- user list contracts
- permission keys

## Required Validation

Run:

```text
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
```

## Required Report

Report:

1. files changed
2. module framework reused
3. endpoints added
4. frontend pages added
5. validation results
6. risks
7. next block

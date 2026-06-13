# Block 18 Prompt — Auth Planning

## Role

Act as senior SaaS authentication planner and security reviewer.

## Objective

Design the first authentication MVP for DCA OS v1 before implementation.

## Scope

Allowed:

- inspect Prisma schema
- inspect API foundation
- inspect frontend foundation
- propose login flow
- propose session model
- propose current user flow
- propose tenant selection flow
- propose validation and audit events

Not allowed:

- no implementation yet
- no migration
- no database changes
- no deployment
- no production credentials

## Required Decisions

Produce decisions for:

- login identifier
- password storage approach
- session storage approach
- browser session approach
- logout behavior
- current user endpoint
- active tenant behavior
- failed login behavior
- audit event names

## MVP Endpoints To Consider

- POST login
- POST logout
- GET current user
- GET available tenants
- POST select tenant

## Required Output

Produce:

1. flow diagram in text
2. endpoint list
3. data model impact
4. frontend impact
5. API middleware impact
6. validation plan
7. implementation phases
8. risks and stop conditions

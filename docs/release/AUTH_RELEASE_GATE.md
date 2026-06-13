# Auth Release Gate

## Purpose

The auth release gate defines when authentication implementation can begin.

## Required Conditions

- auth planning completed
- session model approved
- auth implementation gate review approved
- auth implementation scope documented
- tenant selection flow planned
- current user endpoint planned or explicitly deferred as a skeleton
- logout behavior planned or explicitly deferred as a skeleton
- audit event direction planned
- auth gate design approved

If first-party passwords are ever introduced later, a separate password storage approval is required.

## Not Allowed Before Gate

- login implementation
- password handling implementation
- session persistence
- auth cookies
- production auth settings
- protected business routes

## Exit Output

An auth gate review should produce:

- endpoint list
- data impact
- middleware sequence
- frontend flow
- validation plan
- rollback note
- session and tenant context design
- allowed next-phase auth scope

## Rule

Authentication implementation must be isolated from unrelated module work.

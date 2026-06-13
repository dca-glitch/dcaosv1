# Auth Release Gate

## Purpose

The auth release gate defines when authentication implementation can begin.

## Required Conditions

- auth planning completed
- session model approved
- auth implementation gate review approved
- auth implementation scope documented
- password security requirements documented
- auth schema dependency plan documented
- tenant selection flow planned
- current user endpoint planned or explicitly deferred as a skeleton
- logout behavior planned or explicitly deferred as a skeleton
- audit event direction planned
- auth gate design approved
- controlled password auth strategy approved for MVP

If the password runtime is ever introduced later, the approved password policy and hashing library must be re-reviewed before implementation.

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
- password policy summary
- password reset and lockout summary
- allowed next-phase auth scope

## Rule

Authentication implementation must be isolated from unrelated module work.

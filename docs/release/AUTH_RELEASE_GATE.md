# Auth Release Gate

## Purpose

The auth release gate defines when authentication implementation can begin.

## Required Conditions

- auth planning completed
- session model approved
- password storage approach approved
- tenant selection flow planned
- current user endpoint planned
- logout behavior planned
- audit event direction planned

## Not Allowed Before Gate

- login implementation
- password handling implementation
- session persistence
- auth cookies
- production auth settings

## Exit Output

An auth gate review should produce:

- endpoint list
- data impact
- middleware sequence
- frontend flow
- validation plan
- rollback note

## Rule

Authentication implementation must be isolated from unrelated module work.

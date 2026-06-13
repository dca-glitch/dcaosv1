# Block 17 Prompt — Database Access Layer Planning

## Role

Act as senior backend and database access architect.

## Objective

Plan the database access layer for DCA OS v1 after Prisma Client strategy is approved.

## Scope

Allowed:

- inspect API services
- inspect shared contracts
- inspect data package
- propose database client module shape
- propose repository pattern
- propose service boundary
- propose error handling conventions

Not allowed:

- no migration
- no db push
- no seed execution
- no production credentials
- no broad refactor
- no business module persistence yet

## Expected Design

Define:

- database client ownership
- API import boundary
- repository naming pattern
- transaction approach later
- tenant-aware query helper direction
- error mapping direction
- test strategy later

## Required Output

Produce:

1. proposed folder structure
2. proposed file names
3. boundaries between service and repository
4. first safe implementation block
5. validation commands
6. risks and stop conditions

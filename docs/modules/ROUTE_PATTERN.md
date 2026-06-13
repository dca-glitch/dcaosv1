# Module Route Pattern

## Purpose

Every module should follow a consistent backend route pattern.

## Suggested Pattern

- list records
- get one record
- create record later
- update record later
- archive record later

## Route Layer

The route layer maps URLs to controller methods.

## Controller Layer

The controller layer handles request and response concerns.

## Service Layer

The service layer handles business rules and orchestration.

## Repository Layer

The repository layer will be added after database access is ready.

## Rule

Do not place module-specific business logic directly inside route files.

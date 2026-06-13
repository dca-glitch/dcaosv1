# DCA OS v1 - API Runtime DB Integration Skeleton Plan

## 1. Executive Summary

No API runtime DB integration is approved in this task.

## 2. Future Architecture

- controller -> service -> data package
- data package owns Prisma client boundary
- API never imports Prisma Client directly
- tenant context supplied to data repositories
- audit service used for security-sensitive actions

## 3. Allowed Future Skeleton

Later, before full protected routes, the API may add:

- data service adapters
- request context types
- dependency injection
- readiness checks
- non-sensitive health endpoints

## 4. Forbidden Until Approved

- protected DB-backed routes
- tenant-scoped queries from public request data
- raw Prisma in controllers or routes
- production DB connection
- auth bypass

## 5. Integration Sequence Later

1. request context types
2. auth middleware
3. tenant middleware
4. permission middleware
5. service adapters
6. DB-backed route behind permissions
7. audit writes
8. tests

## 6. Risk Controls

- keep DB access behind the data package
- keep runtime behavior unprotected until auth and tenant flow are approved
- avoid body-supplied tenant identifiers for protected writes
- keep error responses safe and non-revealing

## 7. Open Decisions

- whether system-context operations need a separate handler path
- whether readiness should be split into app and DB checks
- whether a shared context helper belongs in API or data package later

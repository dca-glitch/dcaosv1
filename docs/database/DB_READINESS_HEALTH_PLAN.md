# DCA OS v1 - Database Readiness and Health Plan

## 1. Executive Summary

No runtime DB health endpoint is implemented now.

## 2. Current Health Status

- API health is pre-database
- Prisma validation works
- local DB exists for dev
- runtime API DB connection is blocked

## 3. Future Health Endpoints

- live: app process only
- ready: app dependencies, including DB later
- db readiness check should not expose data

## 4. DB Check Requirements

- simple connection check
- timeout
- no tenant data read
- no schema mutation
- safe error response
- no secrets in response

## 5. Deployment Readiness Later

- production DB URL
- SSL
- migrations applied
- backup strategy
- monitoring

## 6. Open Decisions

- whether readiness should fail closed on DB timeout
- whether live and ready should stay separate in all environments
- whether DB health should be available before auth is implemented

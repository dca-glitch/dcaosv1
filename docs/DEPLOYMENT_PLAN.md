# Deployment Plan

## Purpose

This document describes the future deployment direction for DCA OS v1.

Deployment is not active yet.

## Future URL

The planned production URL is system.digitalcubeagency.net.

## Deployment Target

The planned target is a VPS-based deployment.

## Deployment Readiness

Before deployment, the project should have:

- passing CI
- stable build commands
- environment variable map
- database setup
- migration plan
- backup plan
- reverse proxy plan
- health check plan
- rollback plan

## Application Parts

Expected deployable parts:

- frontend build
- API service
- PostgreSQL database
- reverse proxy
- environment configuration

## Health Checks

The API should expose health endpoints suitable for deployment monitoring.

## Environment Plan

Environment values should be documented before deployment.

Only example names should be committed to the repository.

## Deployment Gate

Deployment should not begin until database, auth, and environment planning are complete.

## Staging Plan

The current VPS staging preparation checklist lives in [VPS Staging Deployment Plan](deployment/VPS_STAGING_DEPLOYMENT_PLAN.md).

The final pre-execution approval package lives in [VPS Staging Execution Approval Pack](deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md).

This project is not deployed yet. Do not run production migrations, `prisma db push`, or VPS deployment commands until an explicit deployment gate is approved.

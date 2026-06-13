# Deployment Release Gate

## Purpose

The deployment release gate defines when VPS deployment work may begin.

## Required Conditions

- CI passing
- build passing
- environment map exists
- database plan completed
- auth plan completed
- health route confirmed
- rollback plan exists
- domain plan confirmed

## Not Allowed Before Gate

- production deploy
- production database connection
- production secrets
- production reverse proxy changes

## Exit Output

A deployment gate review should produce:

- deploy target
- app process plan
- database plan
- environment values list
- rollback plan
- validation plan

## Rule

Deployment must not be mixed with feature implementation.

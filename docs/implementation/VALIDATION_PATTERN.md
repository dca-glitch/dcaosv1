# Validation Pattern

## Purpose

Validation should catch broken code before commit and deployment.

## Current Commands

- npm run check
- npm run build
- npm run -w @dca-os-v1/data prisma:validate
- npm run -w @dca-os-v1/data check

## Module Validation

Every module implementation should pass the full workspace validation set.

## Rule

Do not merge executable module code without validation output.

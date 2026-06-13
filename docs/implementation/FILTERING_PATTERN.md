# Filtering Pattern

## Purpose

List pages and list endpoints should use consistent filter conventions.

## Common Filters

- search text
- status
- date range later
- owner later
- module-specific fields later

## Frontend Behavior

Filters should be represented as page state and query parameters later.

## Backend Behavior

Filters should be validated before they reach repositories.

## Rule

Do not add custom filter behavior without documenting the contract.

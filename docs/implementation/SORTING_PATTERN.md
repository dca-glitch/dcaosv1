# Sorting Pattern

## Purpose

List endpoints should use a consistent sorting model.

## Common Sort Fields

- created date
- updated date
- name
- status

## Direction

Sort direction should be ascending or descending.

## Static Phase

Static module data may use a fixed order.

## Data Phase

Sorting should be applied in repository queries after database integration.

## Rule

Do not add one-off sort parameter names per module.

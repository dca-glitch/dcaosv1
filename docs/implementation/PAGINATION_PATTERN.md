# Pagination Pattern

## Purpose

List endpoints should use a consistent pagination model.

## Basic Fields

- page
- page size
- total count later
- has next page later

## Static Phase

During static module foundations, pagination may be omitted or mocked.

## Data Phase

When database access is added, pagination should be added at the repository layer.

## Rule

Do not invent different pagination shapes for each module.

# Frontend State Pattern

## Purpose

Frontend modules should handle state consistently.

## Required States

- loading
- empty
- error
- ready

## Loading State

Show while data is being prepared or fetched.

## Empty State

Show when no records are available.

## Error State

Show when a module cannot load correctly.

## Ready State

Show normal module content.

## Rule

Do not build custom state handling for every module unless required.

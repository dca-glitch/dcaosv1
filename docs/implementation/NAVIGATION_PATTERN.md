# Navigation Pattern

## Purpose

Navigation should be driven by module metadata where possible.

## Navigation Item

A navigation item should include:

- label
- route
- module key
- order later
- visibility rules later

## Current Phase

Navigation can start static while the module registry is static.

## Future Phase

Navigation should respect:

- active tenant
- module access
- user permissions

## Rule

Do not hard-code every future module in unrelated layout files if registry-driven navigation is available.

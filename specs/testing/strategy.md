# Testing Strategy

## Decision

Curio will use a layered frontend testing strategy:

- unit tests for isolated logic;
- integration tests for component, state, and persistence behavior;
- a small end-to-end suite for critical user flows;
- manual validation for browser-specific media behavior.

## Selected Tools

- `Vitest` for unit and integration tests.
- `React Testing Library` for UI behavior and interaction testing.
- `Playwright` for end-to-end browser testing.

## Why This Strategy Fits Curio

Curio is a static web application, so most product risk is in:

- client-side state transitions;
- persistence behavior;
- media and playback coordination;
- page-level interaction flows.

A layered strategy gives broad confidence without making the test suite too slow or too fragile.

## Unit Test Scope

Unit tests should cover:

- pure utility functions;
- time and loop calculations;
- data transformations;
- session-related logic;
- persistence serialization and deserialization;
- isolated store logic when practical.

## Integration Test Scope

Integration tests should cover:

- React component behavior through user interaction;
- Zustand store integration with UI;
- localization-driven UI text and language switching behavior;
- `localStorage` persistence flows;
- IndexedDB flows through Dexie for persisted local media;
- audio-related orchestration using mocked browser APIs;
- YouTube integration boundaries using mocks or adapters.

## End-to-End Test Scope

Playwright should be used for a limited number of critical flows, such as:

- application boot and basic page rendering;
- navigation between major pages;
- restoring local data after reload;
- core study-session flows;
- session export and import flows;
- missing-media recovery after importing a light backup;
- essential playback-related UI behavior.

The E2E suite should stay small and focused on high-value scenarios.

## Manual Validation Scope

Manual testing will still be required for:

- real browser audio behavior;
- autoplay restrictions;
- YouTube iframe behavior in real browsers;
- seek, loop, and playback edge cases;
- large local-media persistence behavior and browser storage limits;
- backup size differences between light and full copies;
- translated copy review for tone, truncation, and layout impact;
- mobile browser checks;
- performance and responsiveness during audio interaction.

## Playwright MCP Decision

Playwright is approved as the E2E browser automation tool.

Playwright MCP may also be used later to support development and interactive testing workflows, but it is not a required part of the initial project setup.

At the time of this decision, no MCP server is configured in the local environment. Because of that, the project should treat Playwright itself as the testing standard, and treat Playwright MCP as an optional future enhancement.

## Constraints

- Do not rely heavily on brittle snapshot tests.
- Prefer testing observable behavior over implementation details.
- Do not overbuild the E2E layer early in the project.
- Keep browser-specific media validation explicit in manual test documentation.

## Localization Quality Guardrails

- keep a lightweight automated check for obvious hardcoded user-facing text in `.tsx` files;
- treat the automated check as a guardrail, not as a substitute for review;
- verify translated flows through tests when text changes affect interaction or recovery paths.

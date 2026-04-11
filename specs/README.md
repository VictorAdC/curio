# Curio

## Purpose

Curio is a static web application focused on supporting music students in their study routine. The product will provide tools that help learners practice, listen, repeat, organize study materials, and interact with music-related exercises directly in the browser.

The `specs/` folder contains lasting project documentation. It should describe the product, the architecture, and the features used by the application. It should not be used for temporary execution plans.

## Product Goal

Build a browser-based music learning support app that is simple to access, works without a backend in the first phase, and can evolve later without forcing a rewrite of the core frontend architecture.

## Main Decisions

### Application Model

- Curio will start as a static web app.
- The first version will not use a dedicated server or backend.
- Persistence will happen locally in the browser.

### Frontend Stack

- React will be used for the UI layer.
- Vite will be used as the build tool and dev environment.
- TypeScript will be used across the codebase.
- CSS Modules will be used for component styling.

### State and Data

- Zustand will be the default state manager.
- Local persistence will use `localStorage` first.
- If structured or larger client-side persistence becomes necessary, IndexedDB will be added through Dexie.

### Audio and Media

- The Web Audio API will be used for audio-related processing and study tools.
- YouTube audio playback will be integrated through the YouTube Iframe API.

## Documentation Scope

The `specs/` folder should document:

- project purpose and constraints;
- architectural decisions;
- frontend stack choices;
- persistence strategy;
- audio and media integration approach;
- future feature specifications.

## Non-Goals For Now

- No backend services.
- No authentication.
- No server-side database.
- No page implementation yet.
- No feature-specific UI until the core specs are organized.

## Expected Evolution

The project should be structured so future phases can add:

- richer study tools;
- advanced audio controls;
- better persistence strategies;
- possible synchronization or backend features if the product later requires them.

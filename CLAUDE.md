# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + production build
npm run test         # Run tests in watch mode (Vitest)
npm run test:run     # Run tests once
npm run test:e2e     # Run Playwright E2E tests (requires preview server)
npm run check:i18n   # Validate i18n translation keys
```

**Run a single test file:**
```bash
npm run test:run -- src/features/practice-player/utils/sessionPersistence.test.ts
```

**Run tests by name pattern:**
```bash
npm run test -- --watch SessionHistory
```

E2E tests run against the preview server (`npm run preview`) on `http://127.0.0.1:4173`.

## Architecture

Curio is a single-page music practice app. There is no client-side router — the entire app is one `PracticePage`. All data is stored locally in IndexedDB (via Dexie); there are no API calls.

### Feature structure

```
src/
├── app/                        # Root App component + providers
├── pages/PracticePage/         # Page layout + page-level keyboard shortcuts
├── features/
│   ├── practice-player/        # Core feature (playback, markers, sessions)
│   │   ├── adapters/           # LocalMediaAdapter, YouTubePlayerAdapter
│   │   ├── components/         # UI components colocated with CSS modules
│   │   ├── controllers/        # PracticePlayerController (adapter selection)
│   │   ├── hooks/              # usePracticePlayer, useLoopPlayback
│   │   ├── store/              # Zustand store (practiceSessionStore)
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # sessionPersistence, markerTags, errors
│   └── practice-recorder/      # Audio/video capture
├── i18n/                       # messages.ts + useI18n hook
└── styles/                     # Global CSS
```

### State management

A single Zustand store (`usePracticeSessionStore`) is the source of truth. It holds media source, playback state, markers array, session notes, waveform data, and error state. Updates use Immer-style immutable mutations built into Zustand.

The main hook `usePracticePlayer` wires together the store, controller, and persistence layer. Session state is debounce-persisted to IndexedDB on changes (2 s delay). Media blobs are stored separately and retrieved as object URLs.

### Adapter pattern

`PracticePlayerController` selects between `LocalMediaAdapter` (HTML5 audio/video) and `YouTubePlayerAdapter` based on the media source type. Both adapters implement the same playback interface, keeping the hook agnostic to the underlying player.

### Marker system

Markers are timestamped objects with optional title, notes, and tags. The `tags` field supports user-defined tags plus system tags (`loop-start`, `loop-end`). `useLoopPlayback` derives loop region state from markers with those system tags. Marker utilities live in `utils/markerTags.ts`.

### i18n

All user-visible strings come from `src/i18n/messages.ts`. Components call `useI18n()` to get the `t()` translation function. Tests that render localized components must wrap with `I18nProvider`. Run `npm run check:i18n` after adding or removing keys.

### Testing conventions

- Unit/integration tests use Vitest + jsdom + React Testing Library.
- `src/test/setup.ts` provides `fake-indexeddb`, `jest-dom` matchers, and URL mock — it runs automatically.
- Wrap components under test with `I18nProvider` when they use `useI18n()`.
- E2E tests live in `tests/e2e/` and use Playwright (Chromium only).

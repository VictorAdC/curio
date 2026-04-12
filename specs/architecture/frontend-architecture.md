# Frontend Architecture

## Purpose

This document defines how the frontend codebase should be organized as Curio grows.

The main goal is to keep page layout, reusable product features, playback behavior, and source-specific media integrations clearly separated so the Practice page can be implemented without locking the rest of the app into a page-specific structure.

## High-Level Organization

The frontend should be organized around:

- `pages` for route-level layout and composition;
- `features` for reusable product capabilities;
- `components` only for truly app-wide shared UI if needed later;
- `store` or feature-local stores for state ownership;
- `utils` for pure helper logic;
- an app-level localization layer for user-facing text.

The Practice page should be the first consumer of a reusable `practice-player` feature module.

## Suggested Folder Structure

```text
src/
  app/
  i18n/
    I18nProvider.tsx
    messages.ts
  pages/
    PracticePage/
      PracticePage.tsx
      PracticePage.module.css
  features/
    practice-player/
      components/
        MediaSourcePicker/
        TransportControls/
        Timeline/
        WaveformTimeline/
        MarkerList/
        MarkerEditor/
        SessionHistory/
        SessionNotes/
      controllers/
        practicePlayerController.ts
      adapters/
        localMediaAdapter.ts
        youtubePlayerAdapter.ts
      hooks/
        usePracticePlayer.ts
        useLoopPlayback.ts
        useWaveformData.ts
      store/
        practiceSessionStore.ts
      types/
        practicePlayer.ts
      utils/
        sessionPersistence.ts
        time.ts
        youtube.ts
        waveform.ts
```

This structure is directional, not a rigid requirement for file count. The important part is the separation of concerns.

## Responsibility Boundaries

### Pages

Route-level page modules should:

- define page layout;
- compose reusable feature modules;
- handle page-level arrangement of sections;
- avoid owning core playback business logic.

For the Practice page, the page module should arrange the source picker, player area, timeline, controls, marker area, and notes area without implementing the playback engine itself.

Route-level pages may also own temporary page-specific presentation wrappers such as a session drawer shell, as long as the underlying session feature behavior stays inside the reusable feature module.

Pages may render language controls, but they should consume a shared localization provider rather than own translation state themselves.

### Feature Modules

Feature modules should own reusable product behavior.

The `practice-player` feature should contain:

- playback interaction logic;
- source-agnostic control interfaces;
- marker behavior;
- loop behavior;
- session note behavior;
- session history, backup, import, and relink behavior;
- media-source-specific adapters;
- reusable UI parts used by one or more pages.

### Shared Components

Generic app-wide components should only be extracted to a global shared area if they are not specific to the practice workflow.

Localization infrastructure belongs in an app-level shared area rather than inside a single feature module.

Examples that should remain inside `practice-player`:

- transport controls;
- waveform timeline;
- marker list;
- session history;
- session notes tied to playback.

## Practice Player Module Design

The reusable playback module should be organized into the following layers.

### Components

Reusable UI parts that receive data and callbacks through props:

- `MediaSourcePicker`
- `TransportControls`
- `Timeline`
- `WaveformTimeline`
- `MarkerList`
- `MarkerEditor`
- `SessionHistory`
- `SessionNotes`

These components should not own source-specific playback logic.

### Controllers

Controllers define the reusable source-agnostic playback API.

The main controller should expose behavior such as:

- `load(source)`
- `play()`
- `pause()`
- `seek(seconds)`
- `jumpBy(deltaSeconds)`
- `getDuration()`
- `getCurrentTime()`
- `setLoop(startSeconds, endSeconds | null)`
- `clearLoop()`

UI components and hooks should depend on this contract rather than directly on HTML media elements or the YouTube API.

### Adapters

Adapters hide source-specific media implementation details.

- `localMediaAdapter.ts` should manage local audio and video playback through browser media elements.
- `youtubePlayerAdapter.ts` should manage YouTube playback through the YouTube Iframe API.

Adapters should normalize timing, playback, and seek behavior so the rest of the feature can use one playback model.

### Hooks

Hooks should connect controller behavior, store state, and UI composition.

Expected hook responsibilities:

- `usePracticePlayer.ts` for the main feature-facing API;
- `useLoopPlayback.ts` for loop enforcement behavior;
- `useWaveformData.ts` for waveform extraction or retrieval for local audio.

Hooks should coordinate behavior, not become hidden stores.

The main feature-facing hook should expose a stable page-level view model and explicit actions, so route components do not depend directly on internal Zustand mutators.

When hooks need to surface user-facing status or error text, they should consume the localization layer or return structured status data that can be translated at the page boundary.

### Store

State should live in a feature-local Zustand store.

The practice session store should own:

- active source;
- playback status;
- current time;
- duration;
- markers;
- loop selection;
- session note;
- waveform metadata when available;
- load and error state.

This keeps playback state reusable across page layouts and prevents layout components from becoming state containers.

Session-history persistence, backup import/export, and browser-storage side effects should remain in feature utilities and hooks, not in route components.

### Types

Shared domain types should live with the feature and define stable contracts for other modules.

Important types include:

- `PracticeMediaSource`
- `PracticeMarker`
- `LoopSelection`
- `PracticeSessionState`

### Utilities

Utilities should stay pure and side-effect free.

Expected utility areas:

- time formatting and clamping;
- YouTube URL parsing;
- loop validation;
- waveform normalization or transformation;
- session serialization and persistence;
- backup export and import helpers;
- local-media relink validation.

Translation dictionaries should be maintained in a dedicated localization area rather than mixed into feature utilities.

## Localization Rules

- user-facing UI copy must be referenced through translation keys;
- dynamic strings such as confirmations and warnings must support interpolation through the localization layer;
- adding a new language should primarily require a new dictionary, not component rewrites;
- date, time, and locale-sensitive formatting should come from the selected locale when practical.

Current preference behavior:

- the selected language may be persisted locally in browser storage;
- language preference should be treated as app-level UI state, not as practice-session state;
- session exports and imports should not carry language preference.

### Translation-Key Conventions

- translation keys should be grouped by feature or page area, such as `practice.sessionHistory.*`;
- generic app-level keys may live under broader namespaces such as `language.*`;
- components should prefer referencing short, stable keys rather than embedding large translated fragments inline;
- locale-sensitive defaults such as session names should be generated through localized helpers rather than hardcoded English-like formats;
- low-level adapters and persistence utilities should surface structured errors or codes, not user-facing English strings.

## Design Rules

- page modules own layout, not playback logic;
- stores own feature state, not presentational components;
- controllers own playback commands;
- adapters own source-specific integrations;
- hooks coordinate behavior between state and UI;
- components stay reusable and mostly prop-driven;
- utilities remain pure and testable.

## Why This Structure

This organization makes the first Practice page easier to build while keeping future pages free to reuse:

- the same player controls;
- the same marker and loop model;
- the same session-note behavior;
- the same session-history and recovery model;
- the same local and YouTube playback adapters.

It also reduces the chance that a future page will have to copy Practice-specific code just to reuse timeline and playback capabilities.

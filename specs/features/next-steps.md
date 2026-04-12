# Next Steps

## Purpose

This document captures the most relevant next improvements and feature ideas for Curio after the current Practice-page foundation.

It is not a temporary execution log. It should be used as durable product guidance for what to spec and implement next.

## Current Focus Areas

The current product already has:

- a Practice page for local audio, local video, and YouTube;
- markers and loop points;
- session notes;
- saved local sessions;
- session history with restore, rename, delete, import, and export flows;
- localization support for English and Portuguese.

The next steps should improve quality, reduce technical debt, and expand study value without breaking the current local-first model.

## Recommended Near-Term Improvements

### 1. Persistence Quality And Safety

Priority: high

Goals:

- make local persistence more transparent and reliable;
- reduce confusion when media restore fails or browser storage is limited;
- improve confidence in relink and backup flows.

Suggested work:

- add storage-health feedback in the session drawer;
- show clearer success and failure feedback for import, export, and relink actions;
- improve local-media relink validation, potentially with stronger file verification later;
- document browser-storage limits and failure behavior.

Why it matters:

- the current product depends heavily on local persistence;
- data loss or unclear recovery behavior would damage trust quickly.

### 2. Testing For Critical Session Flows

Priority: high

Goals:

- protect the most important local-first behavior from regressions;
- make future UI changes safer.

Suggested work:

- integration tests for session restore after reload;
- integration tests for session import and export;
- integration tests for light-backup missing-media recovery;
- Playwright coverage for the highest-value persistence flows.

Why it matters:

- the most complex product behavior is now in session persistence rather than in layout alone.

### 3. Session Search, Filter, And Organization

Priority: medium

Goals:

- keep the session drawer usable as saved sessions grow.

Suggested work:

- search by session name;
- filter by source type;
- sort by most recent, oldest, or name;
- optional grouping by piece or study context later.

Why it matters:

- the current drawer works for a small number of sessions but will get noisy over time.

### 4. Finish Localization Coverage

Priority: medium

Goals:

- ensure all user-facing text goes through the translation system;
- keep future languages easy to add.

Suggested work:

- review remaining hardcoded strings regularly;
- document translation-key conventions;
- add tests for language switching and translated flows;
- consider lightweight guardrails in review or linting later.

Why it matters:

- localization is now part of the architecture, so new UI should follow the same rule from the start.

## Recommended Near-Term Features

### 1. Playback Speed Control

Priority: high

User value:

- helps music students slow down difficult passages without losing context.

Suggested scope:

- speed presets;
- speed reset;
- preserve pitch when possible.

### 2. Faster Loop Creation

Priority: high

User value:

- reduces friction when repeating small passages.

Suggested scope:

- quick set loop start at current time;
- quick set loop end at current time;
- clear loop quickly;
- optional keyboard shortcuts.

### 3. Keyboard Shortcuts

Priority: high

User value:

- makes practice smoother and less mouse-dependent.

Suggested scope:

- play and pause;
- seek forward and backward;
- add marker;
- set loop start and end;
- open sessions drawer.

### 4. Marker Categories

Priority: medium

User value:

- helps users distinguish between technique issues, phrase boundaries, reminders, and difficult spots.

Suggested scope:

- marker type or color;
- filtering in the marker list;
- clearer timeline representation later.

### 5. Better YouTube Session Metadata

Priority: medium

User value:

- makes saved sessions easier to identify.

Suggested scope:

- better title capture;
- optional thumbnail or richer session summary;
- improved source labeling in history.

### 6. Session Tags Or Piece Grouping

Priority: medium

User value:

- helps organize work across pieces, exercises, or instruments.

Suggested scope:

- user-defined labels;
- grouping by piece name;
- filtering in session history.

## Longer-Term Product Ideas

These are useful, but not as urgent as the items above.

### Practice Templates

- pre-structured session types such as warm-up, section work, or full run-through.

### Timeline Loop Editing

- drag loop boundaries directly on the timeline instead of relying only on marker actions.

### Waveform Improvements

- better normalization;
- zoom levels;
- denser or smarter sampling for long audio files.

### Backup And Archive Management

- a more complete archive-management workflow if saved sessions become a major product surface.

## Suggested Implementation Order

### Quality First

1. persistence feedback and safety improvements;
2. automated coverage for session restore and backup flows;
3. session search and filter support;
4. localization cleanup and guardrails.

### Product Value Next

1. playback speed control;
2. quick loop actions;
3. keyboard shortcuts;
4. marker categories;
5. better YouTube metadata.

## Spec Follow-Ups

The following topics are good candidates for their own feature or architecture specs:

- `playback-speed.md`
- `keyboard-shortcuts.md`
- `session-organization.md`
- `marker-categories.md`
- `backup-and-recovery.md`

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

## Recommended Near-Term Features

### 1. Faster Loop Creation

Priority: high

User value:

- reduces friction when repeating small passages.

Suggested scope:

- quick set loop start at current time;
- quick set loop end at current time;
- clear loop quickly;
- optional keyboard shortcuts.

### 2. Keyboard Shortcuts

Priority: high

User value:

- makes practice smoother and less mouse-dependent.

Suggested scope:

- play and pause;
- seek forward and backward;
- add marker;
- set loop start and end;
- open sessions drawer.

### 3. Marker Categories

Priority: medium

User value:

- helps users distinguish between technique issues, phrase boundaries, reminders, and difficult spots.

Suggested scope:

- marker type or color;
- filtering in the marker list;
- clearer timeline representation later.

### 4. Better YouTube Session Metadata

Priority: medium

User value:

- makes saved sessions easier to identify.

Suggested scope:

- better title capture;
- optional thumbnail or richer session summary;
- improved source labeling in history.

### 5. Session Tags Or Piece Grouping

Priority: medium

User value:

- helps organize work across pieces, exercises, or instruments.

Suggested scope:

- user-defined labels;
- grouping by piece name;
- filtering in session history.

### 6. Extract Audio From Local Video

Priority: medium

User value:

- reduces storage usage when the user only needs the sound from a local video;
- makes full-backup downloads lighter for practice sessions that do not need the visual track.

Suggested scope:

- when a local video is selected, offer an explicit choice to keep the full video or extract audio only;
- if audio-only is chosen, persist the derived session as local audio instead of local video;
- make the storage tradeoff clear before saving the session;
- keep the original video workflow available when visual reference is important.

### 7. Download Saved Local Media

Priority: medium

User value:

- lets the user recover audio or video from a saved session or imported full backup;
- makes local media more portable when the browser is being used as the main working copy.

Suggested scope:

- allow downloading the saved local audio or video file from a session;
- support this for sessions restored from full backups as well as sessions created locally;
- make it clear when media is unavailable because the session came from a light backup;
- keep the download action secondary so it does not compete with normal practice controls.

## Longer-Term Product Ideas

These are useful, but not as urgent as the items above.

### Tablature And Score Sync Spike

- evaluate a future page tab or secondary panel for tablature, chord charts, or simplified score content;
- explore whether a tab or score view can stay synchronized with playback time;
- assess what formats are realistic for v1 of this idea, such as plain text chords, tablature snippets, or structured imported data;
- document whether synchronization should be manual, marker-assisted, or fully time-based.

### Marker Experience Review

- review how markers are currently created, displayed, and edited across the player, timeline, and marker list;
- identify friction in loop assignment, marker discovery, note editing, and timeline representation;
- evaluate improvements such as richer marker states, grouping, categories, inline quick actions, or better visual prominence on the timeline;
- explore a dedicated marker menu or contextual action surface so loop assignment and marker actions are more discoverable than hidden shortcuts;
- produce concrete UX recommendations before expanding marker functionality further.

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

## Pending Navigation Tabs

The bottom navigation bar introduced in the dark-theme refactor includes a HISTORY tab (wired) and a RECORD tab (wired). Two additional tabs are in the design but not yet implemented:

### Library Tab

A future panel for browsing and organizing saved sessions by piece name, user tag, or instrument. Would allow grouping sessions across different source files under a single piece or study topic.

### Settings Tab

App-level preferences panel. Candidates include: language selection, storage management shortcuts, keyboard shortcut customization, and playback defaults.

Both tabs should be specced before implementation to agree on scope and navigation behavior.

---

## Suggested Implementation Order

### Quality First

1. stronger relink verification and recovery feedback.

### Product Value Next

1. quick loop actions;
2. keyboard shortcuts;
3. marker categories;
4. better YouTube metadata;
5. optional audio extraction for local video uploads;
6. saved media download for recovery and portability.

## Spec Follow-Ups

The following topics are good candidates for their own feature or architecture specs:

- `keyboard-shortcuts.md`
- `session-organization.md`
- `marker-categories.md`
- `backup-and-recovery.md`
- `video-audio-extraction.md`
- `media-download.md`
- `tab-sync-spike.md`
- `marker-experience-review.md`

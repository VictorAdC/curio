# Audio And Playback System

## Purpose

This document defines the reusable playback architecture for Curio.

The first consumer is the Practice page, but the playback model must be reusable by future pages that need media loading, transport controls, timeline seeking, markers, and loop behavior.

## Core Design Principle

Playback behavior, marker behavior, and session-level note behavior must live outside any single page layout.

Pages should compose reusable playback modules rather than implement page-specific player logic.

## Supported Media Source Types

The shared playback model must support:

- `local-audio`
- `local-video`
- `youtube`

## Source-Agnostic Player Controller

The reusable playback layer should expose a controller interface with the following behavior:

- `load(source)`
- `play()`
- `pause()`
- `setPlaybackRate(rate)`
- `getPlaybackRate()`
- `seek(seconds)`
- `jumpBy(deltaSeconds)`
- `getDuration()`
- `getCurrentTime()`
- `setLoop(startSeconds, endSeconds | null)`
- `clearLoop()`

The controller is the main interface used by reusable UI components such as timeline and transport controls.

## Adapter Split

The controller should delegate source-specific behavior to adapters.

### Local Media Adapter

The local media adapter is responsible for:

- loading local audio files;
- loading local video files;
- reading metadata from HTML media elements;
- controlling playback through native browser media APIs;
- applying playback-rate changes to the currently active media element;
- attempting pitch preservation for rate changes when browser media APIs support it;
- exposing timing information;
- providing waveform metadata when available for local audio workflows.

This adapter should be backed by an HTML audio or video element.

### YouTube Adapter

The YouTube adapter is responsible for:

- loading a media source from a YouTube URL or video id;
- controlling playback through the YouTube Iframe API;
- applying playback-rate changes through the YouTube player API when supported;
- exposing duration and current time from the embedded player;
- supporting seek and jump behavior through the same shared controller contract.

This adapter should not be responsible for true waveform generation in v1.

## Timeline Model

The timeline must be reusable across media source types.

It should support two rendering modes:

- waveform mode for local audio when waveform data exists;
- generic progress mode for local video or YouTube when waveform data is not available.

The timeline component must accept:

- total duration;
- current time;
- marker positions;
- active loop positions;
- waveform data when available;
- seek interaction callbacks.

In the current Practice-page flow:

- local audio uses a large waveform view plus a thinner secondary timeline for marker positions;
- local video and YouTube use the thinner shared timeline as the primary marker surface.

## Reusable UI Building Blocks

The playback system should be composed from reusable UI modules:

- media source picker;
- transport controls;
- playback speed controls;
- timeline or seek bar;
- waveform renderer for local audio timelines;
- marker list;
- marker editor;
- session notes panel.

These modules should be reusable by future pages without depending on Practice-specific layout or copy.

## Shared Domain Types

### `PracticeMediaSource`

Represents the currently loaded source.

Suggested fields:

- `id`
- `kind`: `local-audio | local-video | youtube`
- `title`
- `durationSeconds`
- `sourceRef`

`sourceRef` should contain the source-specific reference needed by the adapter, such as a file handle description or YouTube video id or URL.

For persisted local sessions, `sourceRef` should also carry browser-storage references and media metadata needed for restore or relink flows, such as:

- persisted media id;
- file name;
- file type;
- file size;
- file last modified timestamp;
- a missing-media flag when a light backup was restored without embedded local media.

### `PracticeMarker`

Represents a timestamped marker within a practice session.

Suggested fields:

- `id`
- `timestampSeconds`
- `title`
- `note`
- `systemTags`
- `userTags`

Initial `systemTags` should support:

- `loop-start`
- `loop-end`
- `media-start`
- `media-end`

Validation should be tag-driven rather than marker-type-driven.

### `LoopSelection`

Represents which markers are currently assigned as the active loop pair.

Suggested fields:

- `startMarkerId | null`
- `endMarkerId | null`

Loop validity must be derived from the timestamps of markers carrying the relevant system tags, not only from ids being present.

### `PracticeSessionState`

Represents the reusable state shape for a page that embeds the practice player stack.

Suggested fields:

- active source;
- playback status;
- playback rate;
- current time;
- duration;
- markers;
- active loop selection;
- session note;
- waveform data when available.

The session model should also support:

- session identity and summary data;
- active-session restore;
- missing-media recovery for imported local-file sessions;
- backup/export and import flows for one or more sessions.

## Loop Behavior

Loop behavior must be shared across adapters.

- loop becomes active only when both loop points exist and define a valid forward range;
- assigning a new `loop-start` after the active `loop-end` must clear the old `loop-end`;
- assigning a new `loop-end` before the active `loop-start` must clear the old `loop-start`;
- media-range tags should follow the same paired validation behavior as loop tags;
- loop state is independent from layout;
- markers remain valid even when loop is inactive;
- switching media must clear or recalculate loop state so invalid loop ranges are never preserved.

## Reusability Rules

- playback state must not be owned by page layout components;
- marker state must not be coupled to a single page presentation;
- marker management should live in a dedicated workspace area rather than only beneath the player canvas;
- transport controls must call the shared controller only;
- timeline components must work with either waveform or generic progress data;
- marker and note modules must work regardless of whether the source is local or YouTube;
- system-tag assignment should be implemented as marker metadata, not as a separate marker object type.

## V1 Constraints

- true waveform rendering is required only for local audio;
- YouTube uses an approximate timeline in v1;
- the reusable model must prioritize a consistent user workflow over source-specific UI differences;
- session state remains local-first and does not require backend synchronization;
- session metadata may live in `localStorage` while larger local media files live in IndexedDB through Dexie.
- pitch preservation for local media is a browser-dependent best-effort capability rather than a guaranteed cross-browser contract.

## Persistence And Recovery Model

The current playback stack supports saved practice sessions.

- Session summaries and serialized session state are stored locally in `localStorage`.
- Local audio and video files are persisted separately in IndexedDB through Dexie.
- Reload restores the most recently active session when possible.
- New source selection creates a new session instead of overwriting an older one.
- The session drawer should expose storage-health feedback derived from local session counts, missing-media counts, persisted local-media size, and browser storage estimates when available.
- Light backups include session data only.
- Full backups include session data plus embedded local media.
- Light-backup imports for local files must support later media relinking.
- Media relinking should warn when the uploaded file diverges from stored metadata, but still allow explicit user confirmation.
- Persistence operations should surface explicit feedback states for success, warning, and failure so the UI does not rely only on generic player errors.

## Component-Level Validation Targets

- the controller contract behaves consistently for local and YouTube sources;
- `jumpBy()` clamps to valid time boundaries;
- timeline rendering falls back cleanly when waveform data is unavailable;
- loop activation requires a valid start and end range;
- marker list and loop role assignment stay accurate after seek, source change, and marker edits.

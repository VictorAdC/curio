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
- exposing timing information;
- providing waveform metadata when available for local audio workflows.

This adapter should be backed by an HTML audio or video element.

### YouTube Adapter

The YouTube adapter is responsible for:

- loading a media source from a YouTube URL or video id;
- controlling playback through the YouTube Iframe API;
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

## Reusable UI Building Blocks

The playback system should be composed from reusable UI modules:

- media source picker;
- transport controls;
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

### `PracticeMarker`

Represents a timestamped marker within a practice session.

Suggested fields:

- `id`
- `timestampSeconds`
- `title`
- `note`
- `loopRole`: `none | start | end`

### `LoopSelection`

Represents which markers are currently assigned as the active loop pair.

Suggested fields:

- `startMarkerId | null`
- `endMarkerId | null`

Loop validity must be derived from the marker timestamps, not only from ids being present.

### `PracticeSessionState`

Represents the reusable state shape for a page that embeds the practice player stack.

Suggested fields:

- active source;
- playback status;
- current time;
- duration;
- markers;
- active loop selection;
- session note;
- waveform data when available.

## Loop Behavior

Loop behavior must be shared across adapters.

- loop becomes active only when both loop points exist and define a valid forward range;
- loop state is independent from layout;
- markers remain valid even when loop is inactive;
- switching media must clear or recalculate loop state so invalid loop ranges are never preserved.

## Reusability Rules

- playback state must not be owned by page layout components;
- marker state must not be coupled to a single page presentation;
- transport controls must call the shared controller only;
- timeline components must work with either waveform or generic progress data;
- marker and note modules must work regardless of whether the source is local or YouTube.

## V1 Constraints

- true waveform rendering is required only for local audio;
- YouTube uses an approximate timeline in v1;
- the reusable model must prioritize a consistent user workflow over source-specific UI differences;
- session state remains local-first and does not require backend synchronization.

## Component-Level Validation Targets

- the controller contract behaves consistently for local and YouTube sources;
- `jumpBy()` clamps to valid time boundaries;
- timeline rendering falls back cleanly when waveform data is unavailable;
- loop activation requires a valid start and end range;
- marker list and loop role assignment stay accurate after seek, source change, and marker edits.

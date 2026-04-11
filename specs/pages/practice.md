# Practice Page

## Purpose

The Practice page is the main focused-study workspace in Curio.

It allows a music student to load local media or a YouTube source, navigate precisely through the material, mark important moments, loop a passage between two selected markers, and write notes tied to the practice session or to specific timestamps.

## Target User

- music students studying a piece, exercise, or recording;
- learners who need repeated playback of short passages;
- users who want notes and timestamped reference points while practicing.

## Supported Sources In V1

- local audio file upload;
- local video file upload;
- YouTube URL input.

## Main Actions

- upload a local audio or video file;
- load a YouTube media source from a URL;
- play and pause media;
- seek through the media by clicking or dragging on the timeline;
- jump backward by `10` seconds;
- jump forward by `10` seconds;
- create multiple markers at timestamps;
- edit marker title and note;
- assign one marker as loop start;
- assign one marker as loop end;
- clear loop assignment;
- edit a session-wide practice note.

## Page Structure

### 1. Media Source Input

The page must provide two entry paths:

- local file upload for audio and video;
- YouTube URL input with explicit load action.

The media source input area should make the current source type clear after loading.

### 2. Now Practicing Header

The page should show:

- current media title;
- source type;
- current playback time;
- total duration when available.

### 3. Main Player Area

The page must render the loaded media when a visual player is appropriate.

- local video should show video playback;
- YouTube should use the embedded YouTube player;
- local audio may show artwork or a simplified audio presentation instead of video content.

### 4. Interactive Timeline

The page must provide a primary seek surface for navigation.

- local audio should display a waveform timeline;
- local video may reuse the same timeline model, with waveform shown only if waveform data is available;
- YouTube should use an approximate seekable timeline in v1, not a true waveform.

The timeline should show:

- current playback position;
- marker positions;
- active loop start and end points when set.

### 5. Transport Controls

The page must expose:

- play and pause;
- `-10s` jump;
- `+10s` jump.

Additional transport controls may be added later, but these are the minimum required controls in v1.

### 6. Marker List

The page must show a marker list for the current session.

Each marker stores:

- `id`;
- `timestampSeconds`;
- `title`;
- optional `note`;
- `loopRole` with values `none`, `start`, or `end`.

The list should allow:

- viewing markers in timestamp order;
- seeking to a marker;
- editing marker title;
- editing marker note;
- assigning loop start;
- assigning loop end;
- removing a marker.

### 7. Session Notes Area

The page must include a general session note area separate from marker notes.

This note is for broad practice observations that are not tied to a single timestamp.

## Looping Model

- users may create multiple markers;
- exactly two markers can be assigned as active loop markers at a time;
- one marker may be assigned as loop start;
- one marker may be assigned as loop end;
- loop playback becomes active only when both markers exist and the start timestamp is before the end timestamp;
- marker records remain valid even when they are not assigned to the active loop;
- if either loop marker is removed, loop playback must be disabled until a valid pair exists again.

## State And Persistence

The page should treat the current practice session as local-first state.

V1 persistence should support local storage of:

- active media session metadata when practical;
- markers for the current session;
- loop marker assignment;
- session note content;
- marker note content;
- last known playback position if this behavior is enabled later.

The exact persistence storage may start in `localStorage`, with IndexedDB available later if the data model grows.

## Navigation Assumption

The Practice page is a top-level destination in the application navigation.

Users should be able to enter the page directly as a primary study workflow, not as a modal or secondary tool.

## Validation And Error Handling

The page must handle the following cases clearly:

- unsupported file types are rejected before load;
- invalid YouTube URLs are rejected with a clear input error;
- media load failures show a recoverable error state;
- timeline seeking is disabled or deferred until metadata is ready;
- if only one loop marker is assigned, the markers are visible but loop playback remains inactive;
- if loop start is at or after loop end, loop playback remains inactive;
- transport controls must clamp seeks and jumps to valid time boundaries;
- switching to a new media source must clear incompatible playback state and must not leave an invalid active loop.

## Acceptance Scenarios

- a user uploads a local audio file and sees waveform-based timeline navigation;
- a user uploads a local video file and uses the same transport and marker workflow;
- a user loads a YouTube URL and uses a seekable timeline without true waveform rendering;
- a user clicks the timeline to seek to a new timestamp;
- a user uses `-10s` and `+10s` to move through the media;
- a user creates several markers and selects two of them as loop boundaries;
- a user adds notes to individual markers;
- a user writes a separate session note not tied to a marker;
- loop playback only activates when both selected loop markers are valid.

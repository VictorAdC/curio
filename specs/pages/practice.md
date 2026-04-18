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

- switch the interface language between English and Portuguese;
- upload a local audio or video file;
- load a YouTube media source from a URL;
- reopen a previously saved local practice session;
- play and pause media;
- seek through the media by clicking or dragging on the timeline;
- jump backward by `5` seconds;
- jump forward by `5` seconds;
- create multiple markers at timestamps;
- edit marker title and note;
- assign or remove special marker tags;
- edit a session-wide practice note;
- rename or delete a saved practice session;
- export saved sessions as a backup copy;
- import sessions from a backup copy;
- relink missing local media after importing a light backup.

## Page Structure

### 1. Media Source Input

The page must provide two entry paths:

- local file upload for audio and video;
- YouTube URL input with explicit load action.

The media source input area should stay visually simple, with the YouTube flow as the primary input and local file selection as a secondary action.

### 2. Now Practicing Header

The page should show:

- current media title;
- current playback time;
- total duration when available.

Session-history access may live in a nearby utility action rather than inside the playback header itself.

The header may also include a language selector if the application exposes localization controls at the page level.

The current control may be implemented as a compact toggle between supported languages rather than as a dropdown.

### 3. Main Player Area

The page must render the loaded media when a visual player is appropriate.

- local video should show video playback;
- YouTube should use the embedded YouTube player;
- local audio may show artwork or a simplified audio presentation instead of video content.

### 4. Interactive Timeline

The page must provide a primary seek surface for navigation.

- local audio should display a waveform timeline;
- local video should use a compact progress bar rather than an overlaid waveform;
- YouTube should use an approximate seekable timeline in v1, not a true waveform.

The timeline should show:

- current playback position;
- marker positions;
- active loop start and end points when set.

For local audio, the large waveform view may stay visually clean while marker positions are shown on a thinner secondary timeline below it.

The compact player footer should show a visible media timestamp in `current / total` form:

- `MM:SS` when total duration is under one hour;
- `HH:MM:SS` when total duration is one hour or more.

### 5. Transport Controls

The page must expose:

- play and pause;
- `-5s` jump;
- `+5s` jump;
- playback speed presets.

Playback speed behavior:

- the page should offer preset playback speeds suitable for practice;
- the selected playback speed should apply to the active source immediately, even while playback is already running;
- local audio and local video should attempt to preserve pitch when the browser supports it;
- YouTube playback speed should use the YouTube player capabilities and may behave according to YouTube platform support.

Additional transport controls may be added later, but these are the minimum required controls in v1.

### 6. Marker Workspace

The page must show a dedicated marker management section for the current session.

Markers should not be managed only as a strip directly below the active audio or video area.

The player surface may still show marker positions, but marker editing and tag management should live in a separate workspace area.

Each marker stores:

- `id`;
- `timestampSeconds`;
- `title`;
- optional `note`;
- `systemTags`;
- `userTags`.

The workspace should allow:

- viewing markers in timestamp order;
- seeking to a marker;
- editing marker title;
- editing marker note;
- assigning and removing system tags;
- filtering markers later by type or tag;
- removing a marker.

Clicking a marker dot on the interactive timeline or a loop boundary display card (showing the set boundary time) opens the marker workspace with that marker expanded in edit mode.

On mobile layouts, the marker workspace must remain visible in the normal page flow below the player rather than disappearing into a desktop-only sidebar treatment.

### 7. Session Notes Area

The page must include a general session note area separate from marker notes.

This note is for broad practice observations that are not tied to a single timestamp.

### 8. Session History

The page must support reopening previously saved sessions, but session history should not compete visually with the main practice workspace.

The preferred model is:

- a dedicated utility action such as `Sessions`;
- a drawer or overlay that contains saved sessions;
- session selection by clicking the session card itself;
- inline rename by editing the session name in place;
- delete with confirmation;
- backup and restore actions grouped at the end of the drawer.
- a storage-health area in the drawer that summarizes saved-session counts, local-media footprint, missing-media counts, and browser-storage caveats.

## Marker And Tag Model

- users may create multiple markers;
- a marker is a time-anchored record;
- tags classify the marker;
- a marker may remain a normal note marker while also carrying one or more system tags.

System tags in the current model are:

- `loop-start`
- `loop-end`
- `media-start`
- `media-end`

Behavior rules:

- `loop-start` and `loop-end` are a related pair;
- `media-start` and `media-end` are a related pair;
- only one marker may hold each system tag at a time; assigning a tag to a new marker removes it from any marker that previously held it;
- a single marker may not hold both sides of the same pair at once; assigning `loop-start` removes `loop-end` from that same marker, and assigning `media-end` removes `media-start` from that same marker, with the inverse also applying;
- when the resulting start/end pair is invalid (start ≥ end), the effective range becomes inactive — the tags are not automatically removed;
- single boundary tags are displayed on the timeline and boundary cards even without the paired tag;
- removing a system tag must keep the marker itself as a normal marker;
- system tags do not require a note;
- loop playback becomes active only when both `loop-start` and `loop-end` exist in a valid forward range.

## State And Persistence

The page should treat the current practice session as local-first state.

V1 persistence supports:

- saved session summaries and active-session tracking in `localStorage`;
- persisted local media files in IndexedDB through Dexie;
- markers for each saved session;
- marker system tags and user tags;
- session note content;
- marker note content;
- current playback position;
- current playback speed;
- waveform data for local audio sessions when available.

Behavior rules:

- reloading the app restores the last active session when possible;
- choosing a new audio, video, or YouTube source creates a new session rather than mutating an older one;
- saved sessions remain available in session history until deleted or cleared;
- light backups export session data without embedded local media;
- full backups export session data plus embedded local media;
- importing a light backup may create sessions that require local-media relinking before playback can resume.
- persistence actions such as import, export, delete, clear, and relink should produce explicit success, warning, or failure feedback rather than failing silently.
- the session drawer should explain that browser storage may still be cleared outside the app, so backups remain recommended even when local persistence looks healthy.

## Navigation Assumption

The Practice page is a top-level destination in the application navigation.

Users should be able to enter the page directly as a primary study workflow, not as a modal or secondary tool.

## Localization

The Practice page must support at least:

- English;
- Portuguese.

Behavior rules:

- the current language should be selectable through a visible app-level control;
- the current language preference should persist locally in the browser across reloads;
- the current language preference should not be part of practice session data, session history, or backup files;
- all user-facing text on the page should come from translation keys rather than hardcoded strings;
- dynamic text such as warnings, confirmations, and labels with values must also support translation;
- future text additions should require dictionary updates, not component rewrites.

## Validation And Error Handling

The page must handle the following cases clearly:

- unsupported file types are rejected before load;
- invalid YouTube URLs are rejected with a clear input error;
- media load failures show a recoverable error state;
- timeline seeking is disabled or deferred until metadata is ready;
- if only one loop tag exists, the markers are visible but loop playback remains inactive;
- if loop start is at or after loop end, loop playback remains inactive;
- if a user assigns the start and end of the same pair to one marker, the previous opposite tag on that marker is removed automatically;
- when loop or media boundary tags produce a conflicting range (start ≥ end), loop playback becomes inactive; no tags are automatically removed;
- transport controls must clamp seeks and jumps to valid time boundaries;
- switching to a new media source must create a fresh session and must not leave an invalid active loop;
- importing a local-file session without embedded media must show a recoverable missing-media state;
- relinking media should compare the uploaded file with stored metadata and warn if the file appears different from the original.
- missing-media recovery text and relink warnings must respect the selected language.
- import, export, relink, delete, and clear-all flows must report clearer success or failure feedback.
- the session drawer should expose browser-storage health when the platform can estimate it, and should fall back to an explanatory note when it cannot.
- playback speed changes should update immediately for the active player rather than waiting for replay or reload.

## Acceptance Scenarios

- a user uploads a local audio file and sees waveform-based timeline navigation;
- a user uploads a local video file and uses the same transport and marker workflow with a compact progress bar and visible marker ticks;
- a user loads a YouTube URL and uses a seekable timeline without true waveform rendering;
- a user clicks the timeline to seek to a new timestamp;
- a user uses `-5s` and `+5s` to move through the media;
- a user changes playback speed while media is already playing and hears the new speed immediately;
- a user creates several markers and assigns special tags for loop and media boundaries;
- a user can see the marker workspace on mobile layouts below the player;
- a user adds notes to individual markers;
- a user writes a separate session note not tied to a marker;
- loop playback only activates when both selected loop markers are valid;
- a user can remove a special tag and keep the marker as a normal marker;
- a user clicks a marker dot on the timeline and the marker workspace opens with that marker expanded in edit mode;
- a user clicks a loop boundary display card and the marker workspace opens focused on the responsible boundary marker;
- a user reloads the app and returns to the most recent session;
- a user opens the session drawer and switches to an older saved session;
- a user exports a light backup and later reimports it;
- a user re-uploads missing local media for an imported light-backup session;
- a user is warned before relinking a file that does not match the expected local media metadata.

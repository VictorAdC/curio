# Marker System

## Goal

Define a richer marker model for Curio that:

- separates marker management from the player canvas;
- supports system-level marker tags that affect playback behavior;
- keeps regular note markers simple;
- allows a marker to remain a normal note marker while also carrying one or more special tags.

## Core Concepts

### Marker

A marker is a time-anchored record in a practice session.

A marker always belongs to a timestamp and may include:

- title;
- optional note;
- user tags;
- system tags.

The marker is the primary object. Tags only classify the marker.

### Tag

A tag is metadata attached to a marker.

Tags do not exist on their own. They only exist as part of a marker.

Two tag families are supported:

- `systemTags`
  These affect playback behavior or future app logic.
- `userTags`
  These help organization and filtering, but do not change playback behavior directly.

## Marker Data Shape

Suggested marker structure:

- `id`
- `timestampSeconds`
- `title`
- `note`
- `systemTags`
- `userTags`

Suggested type examples:

- `systemTags: Array<'loop-start' | 'loop-end' | 'media-start' | 'media-end'>`
- `userTags: string[]`

Rules:

- `note` remains optional;
- a marker with no note is still valid;
- a marker may have no tags;
- a marker may have both user tags and system tags;
- a marker may carry one special tag and still behave as a regular note marker.

## Supported System Tags

The initial system tags should be:

- `loop-start`
- `loop-end`
- `media-start`
- `media-end`

Meaning:

- `loop-start`
  Start boundary for loop playback.
- `loop-end`
  End boundary for loop playback.
- `media-start`
  Preferred default playback start point for future shortcuts or transport actions.
- `media-end`
  Preferred default playback end boundary for future shortcuts or transport actions.

These tags are special because they affect player behavior or future transport rules.

## Validation Rules

### Loop Pair

`loop-start` and `loop-end` are a related pair.

Rules:

- only one marker may hold `loop-start` at a time;
- only one marker may hold `loop-end` at a time;
- the same marker may not hold both `loop-start` and `loop-end` at once;
- both may exist independently; the timeline and boundary cards display any single boundary that is set;
- loop playback only becomes active when both exist and the start timestamp is strictly before the end timestamp;
- when the resulting start/end pair is invalid (start ≥ end), the effective loop range becomes inactive — the tags are not removed.

### Media Pair

`media-start` and `media-end` follow the same linked behavior.

Rules:

- only one marker may hold `media-start` at a time;
- only one marker may hold `media-end` at a time;
- the same marker may not hold both `media-start` and `media-end` at once;
- when the resulting start/end pair is invalid (start ≥ end), the effective range becomes inactive — the tags are not removed.

## Conversion Rules

Users must be able to convert markers between regular and special behavior without losing the marker itself.

Required flows:

- remove a system tag and keep the marker as a normal marker;
- add a system tag to an existing normal marker;
- remove `loop-start`, `loop-end`, `media-start`, or `media-end` and keep the title, note, timestamp, and user tags unchanged;
- convert a special marker into a regular marker without deleting it.

This means:

- system tags are removable;
- system tags do not define marker identity;
- the marker record remains stable while its behavior changes.

## User Tags

`userTags` should remain lightweight and flexible.

At this stage, Curio should not predefine many semantic user tags.

The system should allow:

- no user tags at all;
- manually added user tags later;
- filtering by user tags in future UI revisions.

The feature should not introduce a heavy taxonomy like `mistake`, `difficult`, or `technique` as built-in system concepts.

## UI Organization

Markers should no longer live only as a section directly below the audio or video canvas.

Recommended direction:

- markers should have a dedicated workspace section, similar in importance to sessions;
- marker management should be visually separated from the player surface;
- the player and timeline still display marker positions, but marker editing and management belong to their own area.

Suggested page layout behavior:

- player area focuses on playback, transport, and timeline;
- marker workspace focuses on:
  - marker list;
  - filtering;
  - tag state;
  - notes;
  - loop and media system-tag management.

## Marker Management Surface

The marker workspace should support:

- viewing markers in time order;
- seeing which markers have system tags;
- editing title and note;
- editing user tags;
- assigning and removing special tags;
- filtering markers by:
  - all markers;
  - special markers;
  - regular markers;
  - user tags later.

The workspace should eventually support a dedicated marker menu or contextual action surface for special-tag assignment.

This is preferred over relying on hidden keyboard shortcuts for loop or media boundary assignment.

## Playback Interaction

The player and timeline should still reflect marker state.

Expected behavior:

- system-tagged markers remain visible on the compact timeline;
- loop-active markers should remain visually identifiable;
- when only one loop or media boundary is set, that single boundary is displayed on the timeline and boundary cards even without the paired tag;
- media-start and media-end markers may later influence transport shortcuts or default playback ranges;
- regular markers continue to act as note anchors and seek points;
- clicking a marker dot on the timeline or a loop boundary display card opens the marker workspace with that marker expanded in edit mode.

## Persistence Model

Marker persistence must support:

- title;
- optional note;
- `systemTags`;
- `userTags`;
- timestamp.

Session restore, backup, import, and export must preserve the full marker shape.

## Validation And Recovery

The marker system should behave predictably when tags conflict.

Required behavior:

- conflicting pair assignment is resolved automatically by removing the opposite tag from the same marker before the new tag is applied;
- assigning a start or end tag to a new marker still removes that same tag from any other marker that previously held it;
- system-tag removal must not delete the marker;
- invalid loop or media ranges must never remain active after assignment changes.

## Success Criteria

- marker management is visually independent from the player area;
- a marker can be special and still carry normal note content;
- loop and media special tags obey pair-validation rules automatically;
- removing a special tag keeps the marker as a normal marker;
- the model is flexible enough for future user-tag filtering and marker menus without requiring a second marker object type.

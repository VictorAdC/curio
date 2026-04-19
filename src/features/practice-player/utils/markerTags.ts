import type { PracticeMarker, PracticeSystemTag } from '../types/practicePlayer';

export const SYSTEM_TAGS = ['loop-start', 'loop-end', 'media-start', 'media-end'] as const satisfies PracticeSystemTag[];

const OPPOSITE_SYSTEM_TAG: Record<PracticeSystemTag, PracticeSystemTag> = {
  'loop-start': 'loop-end',
  'loop-end': 'loop-start',
  'media-start': 'media-end',
  'media-end': 'media-start',
};

export function hasSystemTag(marker: PracticeMarker, tag: PracticeSystemTag) {
  return marker.systemTags.includes(tag);
}

export function isSpecialMarker(marker: PracticeMarker) {
  return marker.systemTags.length > 0;
}

export function getTaggedMarker(markers: PracticeMarker[], tag: PracticeSystemTag) {
  return markers.find((marker) => hasSystemTag(marker, tag)) ?? null;
}

function stripSystemTag(marker: PracticeMarker, tag: PracticeSystemTag) {
  if (!hasSystemTag(marker, tag)) {
    return marker;
  }

  return {
    ...marker,
    systemTags: marker.systemTags.filter((currentTag) => currentTag !== tag),
  };
}

function addSystemTag(marker: PracticeMarker, tag: PracticeSystemTag) {
  if (hasSystemTag(marker, tag)) {
    return marker;
  }

  return {
    ...marker,
    systemTags: [...marker.systemTags, tag],
  };
}

export function toggleSystemTag(markers: PracticeMarker[], markerId: string, tag: PracticeSystemTag) {
  const target = markers.find((marker) => marker.id === markerId);

  if (!target) {
    return markers;
  }

  if (hasSystemTag(target, tag)) {
    return markers.map((marker) => (marker.id === markerId ? stripSystemTag(marker, tag) : marker));
  }

  if (!canAssignSystemTag(markers, target, tag)) {
    return markers;
  }

  return markers.map((marker) => {
    if (marker.id === markerId) {
      const withoutOppositeTag = stripSystemTag(marker, OPPOSITE_SYSTEM_TAG[tag]);
      return addSystemTag(withoutOppositeTag, tag);
    }

    return hasSystemTag(marker, tag) ? stripSystemTag(marker, tag) : marker;
  });
}

function canAssignSystemTag(markers: PracticeMarker[], target: PracticeMarker, tag: PracticeSystemTag) {
  const ends = getBoundaryTimes(markers, ['loop-end', 'media-end'], target.id);
  const starts = getBoundaryTimes(markers, ['loop-start', 'media-start'], target.id);

  if (tag === 'loop-start' || tag === 'media-start') {
    const effectiveEnd = ends.length > 0 ? Math.min(...ends) : null;
    return effectiveEnd === null || target.timestampSeconds < effectiveEnd;
  }

  const effectiveStart = starts.length > 0 ? Math.max(...starts) : null;
  return effectiveStart === null || target.timestampSeconds > effectiveStart;
}

function getBoundaryTimes(
  markers: PracticeMarker[],
  tags: PracticeSystemTag[],
  targetMarkerId: string,
) {
  return markers
    .filter((marker) => {
      if (marker.id === targetMarkerId) {
        return false;
      }

      return tags.some((tag) => hasSystemTag(marker, tag));
    })
    .map((marker) => marker.timestampSeconds);
}

export function convertSystemTagToUserTag(
  markers: PracticeMarker[],
  markerId: string,
  tag: PracticeSystemTag,
) {
  return markers.map((marker) => {
    if (marker.id !== markerId) {
      return marker;
    }

    const nextUserTag = marker.userTags.includes(tag) ? marker.userTags : [...marker.userTags, tag];

    return {
      ...marker,
      systemTags: marker.systemTags.filter((currentTag) => currentTag !== tag),
      userTags: nextUserTag,
    };
  });
}

export function getValidLoopRange(markers: PracticeMarker[]) {
  const rawRange = getRawLoopRange(markers);

  if (rawRange.start !== null && rawRange.end !== null && rawRange.start >= rawRange.end) {
    return { start: null, end: null };
  }

  return rawRange;
}

function getRawLoopRange(markers: PracticeMarker[]) {
  const loopStart = getTaggedMarker(markers, 'loop-start');
  const loopEnd = getTaggedMarker(markers, 'loop-end');
  const mediaStart = getTaggedMarker(markers, 'media-start');
  const mediaEnd = getTaggedMarker(markers, 'media-end');

  const starts: number[] = [];
  const ends: number[] = [];

  // All system tags constrain independently
  if (loopStart !== null) starts.push(loopStart.timestampSeconds);
  if (loopEnd !== null) ends.push(loopEnd.timestampSeconds);
  if (mediaStart !== null) starts.push(mediaStart.timestampSeconds);
  if (mediaEnd !== null) ends.push(mediaEnd.timestampSeconds);

  if (starts.length === 0 && ends.length === 0) {
    return { start: null, end: null };
  }

  const effectiveStart = starts.length > 0 ? Math.max(...starts) : null;
  const effectiveEnd = ends.length > 0 ? Math.min(...ends) : null;

  return { start: effectiveStart, end: effectiveEnd };
}

export function getEffectiveLoopRange(markers: PracticeMarker[], durationSeconds: number) {
  const loopRange = getValidLoopRange(markers);

  if (loopRange.start === null && loopRange.end === null) {
    return { start: null, end: null };
  }

  return {
    start: loopRange.start ?? 0,
    end: loopRange.end ?? Math.max(durationSeconds, 0),
  };
}

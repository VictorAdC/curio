import type { PracticeMarker, PracticeSystemTag } from '../types/practicePlayer';

export const SYSTEM_TAGS = ['loop-start', 'loop-end', 'media-start', 'media-end'] as const satisfies PracticeSystemTag[];

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

  return markers.map((marker) => {
    if (marker.id === markerId) {
      return addSystemTag(marker, tag);
    }

    return hasSystemTag(marker, tag) ? stripSystemTag(marker, tag) : marker;
  });
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

  if (effectiveStart !== null && effectiveEnd !== null && effectiveStart >= effectiveEnd) {
    return { start: null, end: null };
  }

  return { start: effectiveStart, end: effectiveEnd };
}

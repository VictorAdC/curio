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

  const nextMarkers = markers.map((marker) => {
    if (marker.id === markerId) {
      return addSystemTag(marker, tag);
    }

    return hasSystemTag(marker, tag) ? stripSystemTag(marker, tag) : marker;
  });

  const nextTarget = nextMarkers.find((marker) => marker.id === markerId);

  if (!nextTarget) {
    return nextMarkers;
  }

  if (tag === 'loop-start') {
    const currentEnd = getTaggedMarker(nextMarkers, 'loop-end');

    if (currentEnd && nextTarget.timestampSeconds >= currentEnd.timestampSeconds) {
      return nextMarkers.map((marker) => stripSystemTag(marker, 'loop-end'));
    }
  }

  if (tag === 'loop-end') {
    const currentStart = getTaggedMarker(nextMarkers, 'loop-start');

    if (currentStart && currentStart.timestampSeconds >= nextTarget.timestampSeconds) {
      return nextMarkers.map((marker) => stripSystemTag(marker, 'loop-start'));
    }
  }

  if (tag === 'media-start') {
    const currentEnd = getTaggedMarker(nextMarkers, 'media-end');

    if (currentEnd && nextTarget.timestampSeconds >= currentEnd.timestampSeconds) {
      return nextMarkers.map((marker) => stripSystemTag(marker, 'media-end'));
    }
  }

  if (tag === 'media-end') {
    const currentStart = getTaggedMarker(nextMarkers, 'media-start');

    if (currentStart && currentStart.timestampSeconds >= nextTarget.timestampSeconds) {
      return nextMarkers.map((marker) => stripSystemTag(marker, 'media-start'));
    }
  }

  return nextMarkers;
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
  const start = getTaggedMarker(markers, 'loop-start');
  const end = getTaggedMarker(markers, 'loop-end');

  if (!start || !end || start.timestampSeconds >= end.timestampSeconds) {
    return {
      start: null,
      end: null,
    };
  }

  return {
    start: start.timestampSeconds,
    end: end.timestampSeconds,
  };
}

import { describe, expect, it } from 'vitest';
import type { PracticeMarker } from '../types/practicePlayer';
import { getEffectiveLoopRange, getValidLoopRange, toggleSystemTag } from './markerTags';

function createMarker(id: string, time: number, systemTags: PracticeMarker['systemTags'] = []): PracticeMarker {
  return {
    id,
    timestampSeconds: time,
    title: id,
    note: '',
    systemTags,
    userTags: [],
  };
}

describe('markerTags toggleSystemTag', () => {
  it('removes loop-end from a marker when loop-start is assigned to the same marker', () => {
    const markers = [
      createMarker('marker-1', 5, ['loop-end']),
      createMarker('marker-2', 12, ['loop-start']),
    ];

    const next = toggleSystemTag(markers, 'marker-1', 'loop-start');
    const target = next.find((marker) => marker.id === 'marker-1');
    const previousStart = next.find((marker) => marker.id === 'marker-2');

    expect(target?.systemTags).toEqual(['loop-start']);
    expect(previousStart?.systemTags).toEqual([]);
  });

  it('removes media-start from a marker when media-end is assigned to the same marker', () => {
    const markers = [
      createMarker('marker-1', 5, ['media-start']),
      createMarker('marker-2', 12, ['media-end']),
    ];

    const next = toggleSystemTag(markers, 'marker-1', 'media-end');
    const target = next.find((marker) => marker.id === 'marker-1');
    const previousEnd = next.find((marker) => marker.id === 'marker-2');

    expect(target?.systemTags).toEqual(['media-end']);
    expect(previousEnd?.systemTags).toEqual([]);
  });

  it('does not allow assigning a start at or after the effective end', () => {
    const markers = [
      createMarker('marker-1', 20, ['loop-end']),
      createMarker('marker-2', 25),
    ];

    const next = toggleSystemTag(markers, 'marker-2', 'loop-start');

    expect(next).toEqual(markers);
  });

  it('does not allow assigning an end at or before the effective start', () => {
    const markers = [
      createMarker('marker-1', 20, ['media-start']),
      createMarker('marker-2', 15),
    ];

    const next = toggleSystemTag(markers, 'marker-2', 'media-end');

    expect(next).toEqual(markers);
  });
});

describe('markerTags loop range calculation', () => {
  it('uses the later start and earlier end across loop and media boundaries', () => {
    const markers = [
      createMarker('loop-start', 12, ['loop-start']),
      createMarker('loop-end', 40, ['loop-end']),
      createMarker('media-start', 18, ['media-start']),
      createMarker('media-end', 32, ['media-end']),
    ];

    expect(getValidLoopRange(markers)).toEqual({ start: 18, end: 32 });
  });

  it('fills in media boundaries when only one side is set', () => {
    const markers = [createMarker('loop-start', 18, ['loop-start'])];

    expect(getEffectiveLoopRange(markers, 90)).toEqual({ start: 18, end: 90 });
    expect(getEffectiveLoopRange([createMarker('loop-end', 32, ['loop-end'])], 90)).toEqual({ start: 0, end: 32 });
  });
});

import { describe, expect, it } from 'vitest';
import type { PracticeMarker } from '../types/practicePlayer';
import { toggleSystemTag } from './markerTags';

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
});

import { describe, expect, it } from 'vitest';
import { formatMediaTimestamp, formatTime } from './time';

describe('time formatting', () => {
  it('formats short timestamps as MM:SS', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatMediaTimestamp(65, 659)).toBe('01:05');
  });

  it('keeps media timestamps under one hour in MM:SS even near the upper bound', () => {
    expect(formatMediaTimestamp(3599, 3599)).toBe('59:59');
  });

  it('formats media timestamps as HH:MM:SS when duration is one hour or more', () => {
    expect(formatMediaTimestamp(65, 3600)).toBe('00:01:05');
    expect(formatMediaTimestamp(3661, 7200)).toBe('01:01:01');
  });
});

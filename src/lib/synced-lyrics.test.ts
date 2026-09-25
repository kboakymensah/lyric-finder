import { describe, expect, it } from 'vitest';

import { activeLyricIndex, parseSyncedLyrics } from './synced-lyrics';

describe('parseSyncedLyrics', () => {
  it('parses, trims, and sorts valid timestamped lines', () => {
    expect(parseSyncedLyrics('[00:10.00] Second\n[00:01.50] First ')).toEqual([
      { timeSeconds: 1.5, text: 'First' },
      { timeSeconds: 10, text: 'Second' },
    ]);
  });

  it('skips malformed and blank lyric lines', () => {
    expect(parseSyncedLyrics('[bad]Nope\n[00:02.00]Good\n[00:03.00]   ')).toEqual([
      { timeSeconds: 2, text: 'Good' },
    ]);
  });
});

describe('activeLyricIndex', () => {
  const lines = [
    { timeSeconds: 1.5, text: 'First' },
    { timeSeconds: 10, text: 'Second' },
  ];

  it('selects the latest line at or before playback time', () => {
    expect(activeLyricIndex(lines, 0.5)).toBeNull();
    expect(activeLyricIndex(lines, 1.5)).toBe(0);
    expect(activeLyricIndex(lines, 9.99)).toBe(0);
    expect(activeLyricIndex(lines, 10)).toBe(1);
  });
});

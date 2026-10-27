import { describe, expect, it } from 'vitest';

import { parseLrclibLyrics } from './lyric-fallback';

describe('parseLrclibLyrics', () => {
  it('keeps plain lyrics when the provider has no synced timestamps', () => {
    expect(parseLrclibLyrics({ plainLyrics: 'Hello, it is me', syncedLyrics: null })).toEqual({
      lines: [],
      plainLyrics: 'Hello, it is me',
    });
  });
});

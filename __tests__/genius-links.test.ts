import { describe, expect, it } from 'vitest';

import { lyricDestination } from '../lib/genius-links';

describe('lyricDestination', () => {
  it('uses the direct Genius lyrics page without an unavailable warning when the result includes one', () => {
    expect(lyricDestination({
      title: 'Hello',
      artist: 'Adele',
      lyricsUrl: 'https://genius.com/Adele-hello-lyrics',
    }, 'hello from the other side')).toEqual({
      url: 'https://genius.com/Adele-hello-lyrics',
      geniusUnavailable: false,
    });
  });

  it('falls back to a Google lyric search only when Genius has no direct page', () => {
    expect(lyricDestination({ title: 'Hello', artist: 'Adele', lyricsUrl: null }, 'hello from the other side'))
      .toEqual({
        url: 'https://www.google.com/search?q=hello%20from%20the%20other%20side%20lyrics',
        geniusUnavailable: true,
      });
  });
});

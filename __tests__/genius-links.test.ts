import { describe, expect, it } from 'vitest';

import { geniusLyricsUrl } from '../lib/genius-links';

describe('geniusLyricsUrl', () => {
  it('uses the direct Genius lyrics page when the search result includes one', () => {
    expect(geniusLyricsUrl({
      title: 'Hello',
      artist: 'Adele',
      lyricsUrl: 'https://genius.com/Adele-hello-lyrics',
    })).toBe('https://genius.com/Adele-hello-lyrics');
  });

  it('falls back to a Genius search for results without a direct lyrics page', () => {
    expect(geniusLyricsUrl({ title: 'Hello', artist: 'Adele', lyricsUrl: null }))
      .toBe('https://genius.com/search?q=Hello%20Adele');
  });
});

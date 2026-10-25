import { describe, expect, it } from 'vitest';

import { lyricDetailStatus } from '../lib/song-details';

describe('Song Details lyric status', () => {
  it('labels missing lyrics rather than inventing them', () => {
    expect(lyricDetailStatus(null)).toEqual({ label: 'Lyrics unavailable', isExcerpt: false });
  });

  it('labels returned lyric text as an excerpt', () => {
    expect(lyricDetailStatus('A real match')).toEqual({ label: 'Lyric excerpt', isExcerpt: true });
  });
});

import { describe, expect, it } from 'vitest';

import { artistsFromSongMatches } from './artist-discovery';
import type { SongResult } from '../types/song';

const song = (id: string, artist: string): SongResult => ({
  id,
  title: `Song ${id}`,
  artist,
  artworkUrl: null,
  lyricsUrl: null,
  lyricSnippet: null,
  previewUrl: null,
  listenUrl: 'https://example.com/listen',
  matchScore: 0.9,
});

describe('artistsFromSongMatches', () => {
  it('returns each real matched artist once in result order', () => {
    expect(artistsFromSongMatches([
      song('one', 'Artist One'),
      song('two', 'artist one'),
      song('three', 'Artist Two'),
    ])).toEqual(['Artist One', 'Artist Two']);
  });

  it('does not include missing artist labels', () => {
    expect(artistsFromSongMatches([song('one', ' '), song('two', 'Artist Two')])).toEqual(['Artist Two']);
  });
});

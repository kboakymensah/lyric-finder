import { describe, expect, it } from 'vitest';

import { findRelatedSongs } from './related-songs';

const currentSong = {
  id: 'current', title: 'Golden Hour', artist: 'The Artist', artworkUrl: null, lyricsUrl: null, previewUrl: 'https://example.com/current.m4a', listenUrl: 'https://music.apple.com/current',
};

describe('related songs', () => {
  it('keeps playable catalog songs by the same artist and excludes the current song', async () => {
    const related = await findRelatedSongs(currentSong, async () => new Response(JSON.stringify({ results: [
      { trackId: 'current', trackName: 'Golden Hour', artistName: 'The Artist', previewUrl: 'https://example.com/current.m4a', trackViewUrl: 'https://music.apple.com/current' },
      { trackId: 'related', trackName: 'Blue Hour', artistName: 'The Artist', previewUrl: 'https://example.com/related.m4a', trackViewUrl: 'https://music.apple.com/related' },
      { trackId: 'unplayable', trackName: 'No Preview', artistName: 'The Artist', trackViewUrl: 'https://music.apple.com/unplayable' },
    ] }), { status: 200 }));

    expect(related.map((song) => song.id)).toEqual(['related']);
  });
});

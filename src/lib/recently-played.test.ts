import { describe, expect, it } from 'vitest';

import { addRecentlyPlayed, parseRecentlyPlayed } from './recently-played';

const song = { id: 'one', title: 'First song', artist: 'Artist', artworkUrl: null, lyricsUrl: null, previewUrl: 'https://example.com/one.m4a', listenUrl: 'https://example.com/one' };

describe('recently played songs', () => {
  it('puts a newly played song first and removes duplicates', () => {
    expect(addRecentlyPlayed([song], { ...song, id: 'two', title: 'Second song' })).toEqual([{ ...song, id: 'two', title: 'Second song' }, song]);
    expect(addRecentlyPlayed([song, { ...song, id: 'two' }], song)).toEqual([song, { ...song, id: 'two' }]);
  });

  it('only restores valid persisted songs', () => {
    expect(parseRecentlyPlayed(JSON.stringify([song, { id: 1 }]))).toEqual([song]);
    expect(parseRecentlyPlayed('not json')).toEqual([]);
  });
});

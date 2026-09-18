import { describe, expect, it } from 'vitest';

import type { SongResult } from '../types/song';
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  emptyLibrary,
  parseLibrary,
  removeSongFromPlaylist,
  toSavedSong,
  toggleLikedSong,
} from './library';

const song = {
  id: 'song-1',
  title: 'Golden Hour',
  artist: 'The Artist',
  artworkUrl: 'https://example.com/artwork.jpg',
  lyricsUrl: 'https://example.com/lyrics',
  previewUrl: 'https://example.com/preview.mp3',
  listenUrl: 'https://example.com/listen',
};

describe('local library operations', () => {
  it('adds then removes a liked song without duplicates', () => {
    const liked = toggleLikedSong(emptyLibrary, song);
    expect(liked.likedSongs).toEqual([song]);
    expect(toggleLikedSong(liked, song).likedSongs).toEqual([]);
  });

  it('creates one trimmed playlist and rejects blank or duplicate names', () => {
    const next = createPlaylist(emptyLibrary, ' Road Trip ');
    expect(next.playlists).toHaveLength(1);
    expect(next.playlists[0].name).toBe('Road Trip');
    expect(createPlaylist(next, 'road trip').playlists).toHaveLength(1);
    expect(createPlaylist(next, '   ').playlists).toHaveLength(1);
  });

  it('does not share existing playlist song IDs with a created-library result', () => {
    const input = {
      likedSongs: [],
      playlists: [{ id: 'existing', name: 'Existing', songIds: ['song-1'] }],
    };

    const result = createPlaylist(input, 'New Playlist');
    result.playlists[0].songIds.push('song-2');

    expect(input.playlists[0].songIds).toEqual(['song-1']);
  });

  it('adds a liked song once, removes it, deletes a playlist, and rejects corrupt JSON', () => {
    const liked = toggleLikedSong(emptyLibrary, song);
    const withPlaylist = createPlaylist(liked, 'Road Trip');
    const id = withPlaylist.playlists[0].id;
    const withSong = addSongToPlaylist(withPlaylist, id, song.id);
    expect(withSong.playlists[0].songIds).toEqual([song.id]);
    expect(addSongToPlaylist(withSong, id, song.id).playlists[0].songIds).toEqual([song.id]);
    expect(removeSongFromPlaylist(withSong, id, song.id).playlists[0].songIds).toEqual([]);
    expect(deletePlaylist(withPlaylist, id).playlists).toEqual([]);
    expect(parseLibrary('{bad json}')).toEqual(emptyLibrary);
  });

  it('returns an empty library for invalid stored data', () => {
    expect(parseLibrary('{"likedSongs":"wrong","playlists":[]}')).toEqual(emptyLibrary);
    expect(parseLibrary('{"likedSongs":[],"playlists":[{"id":"a","name":"Road Trip","songIds":"wrong"}]}')).toEqual(emptyLibrary);
  });

  it('converts a search result into the persistable song shape', () => {
    const result: SongResult = { ...song, lyricSnippet: 'A line', matchScore: 0.98 };
    expect(toSavedSong(result)).toEqual(song);
  });
});

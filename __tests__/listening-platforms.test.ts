import { describe, expect, it } from 'vitest';

import { listeningUrl } from '../src/lib/listening-platforms';
import type { SongResult } from '../src/types/song';

const song: SongResult = {
  id: 'hello-adele',
  title: 'Hello',
  artist: 'Adele',
  artworkUrl: null,
  lyricsUrl: null,
  lyricSnippet: null,
  previewUrl: null,
  listenUrl: 'https://music.apple.com/us/album/hello/1051394208?i=1051394211',
  matchScore: 100,
};

describe('listeningUrl', () => {
  it('keeps the catalog Apple Music track link when one is available', () => {
    expect(listeningUrl(song, 'appleMusic')).toBe(song.listenUrl);
  });

  it('builds a Spotify search link from the song title and artist', () => {
    expect(listeningUrl(song, 'spotify')).toBe('https://open.spotify.com/search/Hello%20Adele');
  });

  it('builds a SoundCloud search link from the song title and artist', () => {
    expect(listeningUrl(song, 'soundcloud')).toBe('https://soundcloud.com/search/sounds?q=Hello%20Adele');
  });

  it('builds a web search fallback from the song title and artist', () => {
    expect(listeningUrl(song, 'webSearch')).toBe('https://www.google.com/search?q=Hello%20Adele%20song');
  });

  it('uses an Apple Music search when no direct Apple Music link exists', () => {
    expect(listeningUrl({ ...song, listenUrl: 'https://www.google.com/search?q=Hello' }, 'appleMusic')).toBe(
      'https://music.apple.com/us/search?term=Hello%20Adele',
    );
  });
});

import { describe, expect, it, vi } from 'vitest';

import { enrichMissingCatalog } from './itunes-catalog';
import type { SongResult } from '../types/song';

const song: SongResult = {
  id: '200546',
  title: 'Hold On, We’re Going Home',
  artist: 'Drake',
  artworkUrl: 'https://genius.example/artwork.jpg',
  lyricsUrl: 'https://genius.com/Drake-hold-on-were-going-home-lyrics',
  lyricSnippet: null,
  previewUrl: null,
  listenUrl: 'https://genius.com/Drake-hold-on-were-going-home-lyrics',
  matchScore: 100,
};

describe('enrichMissingCatalog', () => {
  it('fills a missing Apple Music link and preview from the device catalog request', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ results: [{
      trackName: "Hold On, We're Going Home (feat. Majid Jordan)",
      artistName: 'Drake',
      artworkUrl100: 'https://itunes.example/drake.jpg',
      previewUrl: 'https://itunes.example/drake.m4a',
      trackViewUrl: 'https://music.apple.com/us/album/hold-on-were-going-home/1440829462?i=1440829630',
    }] })));

    await expect(enrichMissingCatalog(song, fetcher)).resolves.toMatchObject({
      artworkUrl: song.artworkUrl,
      previewUrl: 'https://itunes.example/drake.m4a',
      listenUrl: 'https://music.apple.com/us/album/hold-on-were-going-home/1440829462?i=1440829630',
    });
  });

  it('does not request the catalog when a result already has a direct Apple Music link and preview', async () => {
    const fetcher = vi.fn();
    const completeSong = {
      ...song,
      previewUrl: 'https://itunes.example/drake.m4a',
      listenUrl: 'https://music.apple.com/us/album/hold-on-were-going-home/1440829462?i=1440829630',
    };

    await expect(enrichMissingCatalog(completeSong, fetcher)).resolves.toEqual(completeSong);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';

import { searchSongs } from '../src/search';

describe('searchSongs', () => {
  it('enriches an LRCLIB match with a free iTunes preview and link', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: 1, trackName: 'Hello', artistName: 'Adele', plainLyrics: 'Hello from the other side', albumName: '25',
      }])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{
        trackId: 2, trackName: 'Hello', artistName: 'Adele', artworkUrl100: 'https://cover', previewUrl: 'https://preview', trackViewUrl: 'https://track',
      }] })));

    await expect(searchSongs('hello from the other side', fetcher)).resolves.toEqual([expect.objectContaining({
      title: 'Hello', artist: 'Adele', previewUrl: 'https://preview', listenUrl: 'https://track', lyricSnippet: 'Hello from the other side',
    })]);
  });
});

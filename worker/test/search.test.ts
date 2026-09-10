import { describe, expect, it, vi } from 'vitest';

import { normalizeLyricQuery, scoreLyricMatch, searchSongs } from '../src/search';

describe('lyric query helpers', () => {
  it('keeps the trimmed query and adds only a distinct whitespace-normalized variant', () => {
    expect(normalizeLyricQuery('  hello   from the other side  ')).toEqual([
      'hello   from the other side',
      'hello from the other side',
    ]);
    expect(normalizeLyricQuery('hello from the other side')).toEqual(['hello from the other side']);
  });

  it('adds contraction-normalized and short-phrase fallbacks for long lyric searches', () => {
    expect(normalizeLyricQuery('hello from the other side I must have called a thousand times')).toEqual([
      'hello from the other side I must have called a thousand times',
      "hello from the other side I must've called a thousand times",
      'hello from the other side',
    ]);
  });

  it('scores normalized lyric-token overlap from zero to one hundred', () => {
    expect(scoreLyricMatch('Hello, from the other side', 'hello from the other side')).toBe(100);
    expect(scoreLyricMatch('hello from the other side', 'hello from nowhere')).toBe(40);
    expect(scoreLyricMatch('hello from the other side', null)).toBe(0);
  });
});

describe('searchSongs', () => {
  it('ranks Adele\'s Hello above an unrelated lyric candidate by overlap', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 1, trackName: 'Other', artistName: 'Artist', plainLyrics: 'nothing in common' },
        { id: 2, trackName: 'Hello', artistName: 'Adele', plainLyrics: 'Hello from the other side' },
      ])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));

    await expect(searchSongs('hello from the other side', fetcher)).resolves.toEqual([
      expect.objectContaining({ title: 'Hello', artist: 'Adele', matchScore: 100 }),
      expect.objectContaining({ title: 'Other', artist: 'Artist', matchScore: 0 }),
    ]);
  });

  it('retains a valid LRCLIB match when iTunes has no metadata', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 3, trackName: 'Unknown Song', artistName: 'Unknown Artist', plainLyrics: 'unknown words' },
      ])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));

    await expect(searchSongs('unknown words', fetcher)).resolves.toEqual([
      expect.objectContaining({
        title: 'Unknown Song',
        artist: 'Unknown Artist',
        artworkUrl: null,
        previewUrl: null,
        listenUrl: 'https://www.google.com/search?q=Unknown%20Song%20Unknown%20Artist%20song',
      }),
    ]);
  });

  it('de-duplicates LRCLIB matches by normalized title and artist', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 4, trackName: 'Hello', artistName: 'Adele', plainLyrics: 'hello from the other side' },
        { id: 5, trackName: ' hello ', artistName: ' ADELE ', plainLyrics: 'hello from the other side' },
      ])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));

    await expect(searchSongs('hello from the other side', fetcher)).resolves.toHaveLength(1);
  });

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

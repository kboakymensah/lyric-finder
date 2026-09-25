import { describe, expect, it } from 'vitest';

import type { SavedSong } from '../types/song';
import { buildPreviewQueue, clampPreviewSeek, nextQueueIndex, previousQueueIndex } from './preview-queue';

const playableSong: SavedSong = {
  id: 'playable',
  title: 'Playable song',
  artist: 'The Artist',
  artworkUrl: null,
  lyricsUrl: null,
  previewUrl: 'https://example.com/preview.m4a',
  listenUrl: 'https://music.apple.com/example',
};

const unavailableSong: SavedSong = {
  ...playableSong,
  id: 'unavailable',
  title: 'Unavailable song',
  previewUrl: null,
};

describe('preview queue helpers', () => {
  it('keeps only saved songs with preview URLs in a queue', () => {
    expect(buildPreviewQueue([playableSong, unavailableSong])).toEqual([playableSong]);
  });

  it('does not move beyond queue boundaries', () => {
    expect(previousQueueIndex(0)).toBe(0);
    expect(nextQueueIndex(2, 3)).toBe(2);
  });

  it('clamps seek positions within a known preview duration', () => {
    expect(clampPreviewSeek(-10, 30)).toBe(0);
    expect(clampPreviewSeek(45, 30)).toBe(30);
  });
});

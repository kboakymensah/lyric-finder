import { describe, expect, it } from 'vitest';

import type { SavedSong } from '../types/song';
import { buildPreviewQueue, clampPreviewSeek, nextPlaybackIndex, nextQueueIndex, previousQueueIndex, shufflePreviewQueue } from './preview-queue';

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

  it('returns an empty queue when every saved song lacks a preview', () => {
    expect(buildPreviewQueue([unavailableSong])).toEqual([]);
  });

  it('reorders a multi-song preview queue for shuffle playback', () => {
    const secondSong = { ...playableSong, id: 'second' };
    const thirdSong = { ...playableSong, id: 'third' };
    expect(shufflePreviewQueue([playableSong, secondSong, thirdSong], () => 0)).toEqual([secondSong, thirdSong, playableSong]);
  });

  it('does not move beyond queue boundaries', () => {
    expect(previousQueueIndex(0)).toBe(0);
    expect(previousQueueIndex(1)).toBe(0);
    expect(nextQueueIndex(2, 3)).toBe(2);
  });

  it('clamps seek positions within a known preview duration', () => {
    expect(clampPreviewSeek(-10, 30)).toBe(0);
    expect(clampPreviewSeek(45, 30)).toBe(30);
  });

  it('restarts a preview in repeat-one mode', () => {
    expect(nextPlaybackIndex(1, 3, 'repeat-one')).toBe(1);
  });

  it('loops from the final preview to the first preview in repeat-all mode', () => {
    expect(nextPlaybackIndex(2, 3, 'repeat-all')).toBe(0);
  });

  it('picks a different preview in shuffle mode when one is available', () => {
    expect(nextPlaybackIndex(1, 3, 'shuffle', () => 0.9)).not.toBe(1);
  });
});

import type { SavedSong } from '../types/song';

export type PlaybackMode = 'normal' | 'shuffle' | 'repeat-all' | 'repeat-one';

export function buildPreviewQueue(songs: SavedSong[]) {
  return songs.filter((song) => Boolean(song.previewUrl));
}

export function nextQueueIndex(index: number, queueLength: number) {
  return Math.min(index + 1, Math.max(queueLength - 1, 0));
}

export function previousQueueIndex(index: number) {
  return Math.max(index - 1, 0);
}

export function nextPlaybackIndex(
  index: number,
  queueLength: number,
  mode: PlaybackMode,
  random: () => number = Math.random,
) {
  if (queueLength === 0) return null;
  if (mode === 'repeat-one') return index;
  if (mode === 'repeat-all') return (index + 1) % queueLength;
  if (mode === 'shuffle' && queueLength > 1) {
    const offset = 1 + Math.floor(random() * (queueLength - 1));
    return (index + offset) % queueLength;
  }
  return index < queueLength - 1 ? index + 1 : null;
}

export function clampPreviewSeek(positionSeconds: number, durationSeconds: number) {
  return Math.max(0, Math.min(positionSeconds, durationSeconds));
}

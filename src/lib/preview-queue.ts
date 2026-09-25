import type { SavedSong } from '../types/song';

export function buildPreviewQueue(songs: SavedSong[]) {
  return songs.filter((song) => Boolean(song.previewUrl));
}

export function nextQueueIndex(index: number, queueLength: number) {
  return Math.min(index + 1, Math.max(queueLength - 1, 0));
}

export function previousQueueIndex(index: number) {
  return Math.max(index - 1, 0);
}

export function clampPreviewSeek(positionSeconds: number, durationSeconds: number) {
  return Math.max(0, Math.min(positionSeconds, durationSeconds));
}

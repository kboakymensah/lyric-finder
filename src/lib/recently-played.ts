import type { SavedSong } from '../types/song';

const MAX_RECENTLY_PLAYED = 8;

function isSavedSong(value: unknown): value is SavedSong {
  if (!value || typeof value !== 'object') return false;
  const song = value as Record<string, unknown>;
  return typeof song.id === 'string' && typeof song.title === 'string' && typeof song.artist === 'string' &&
    (typeof song.artworkUrl === 'string' || song.artworkUrl === null) &&
    (typeof song.lyricsUrl === 'string' || song.lyricsUrl === null) &&
    (typeof song.previewUrl === 'string' || song.previewUrl === null) && typeof song.listenUrl === 'string';
}

export function parseRecentlyPlayed(stored: string): SavedSong[] {
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isSavedSong).slice(0, MAX_RECENTLY_PLAYED) : [];
  } catch {
    return [];
  }
}

export function addRecentlyPlayed(history: SavedSong[], song: SavedSong): SavedSong[] {
  return [song, ...history.filter((item) => item.id !== song.id)].slice(0, MAX_RECENTLY_PLAYED);
}

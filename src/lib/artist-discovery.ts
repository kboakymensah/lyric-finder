import type { SongResult } from '../types/song';

/** Returns actual artists represented by the current lyric-search matches. */
export function artistsFromSongMatches(songs: SongResult[]): string[] {
  const seen = new Set<string>();

  return songs.flatMap((song) => {
    const artist = song.artist.trim();
    const key = artist.toLocaleLowerCase();
    if (!artist || seen.has(key)) return [];
    seen.add(key);
    return [artist];
  });
}

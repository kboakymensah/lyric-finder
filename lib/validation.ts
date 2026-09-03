export function validateLyrics(lyrics: string): string | null {
  return lyrics.trim().length >= 8 ? null : 'Enter at least a few lyric words.';
}

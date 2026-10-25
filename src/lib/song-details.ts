export function lyricDetailStatus(lyricSnippet: string | null | undefined) {
  return lyricSnippet ? { label: 'Lyric excerpt', isExcerpt: true } : { label: 'Lyrics unavailable', isExcerpt: false };
}

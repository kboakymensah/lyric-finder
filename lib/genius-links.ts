type LyricsResult = {
  title: string;
  artist: string;
  lyricsUrl: string | null;
};

export function lyricDestination(song: LyricsResult, originalLyrics: string) {
  if (song.lyricsUrl) return { url: song.lyricsUrl, geniusUnavailable: false };

  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(`${originalLyrics} lyrics`)}`,
    geniusUnavailable: true,
  };
}

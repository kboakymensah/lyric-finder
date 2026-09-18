type LyricsResult = {
  title: string;
  artist: string;
  lyricsUrl: string | null;
};

export const geniusLyricsUrl = (song: LyricsResult): string =>
  song.lyricsUrl ?? `https://genius.com/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`;

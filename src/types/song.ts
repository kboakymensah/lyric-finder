export type SongResult = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  lyricsUrl: string | null;
  lyricSnippet: string | null;
  previewUrl: string | null;
  listenUrl: string;
  matchScore: number;
};

export type SavedSong = Pick<SongResult, 'id' | 'title' | 'artist' | 'artworkUrl' | 'lyricsUrl' | 'previewUrl' | 'listenUrl'>;

export type SongSearchResponse = {
  results: SongResult[];
};

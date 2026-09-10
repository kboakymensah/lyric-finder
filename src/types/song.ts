export type SongResult = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  lyricSnippet: string | null;
  previewUrl: string | null;
  listenUrl: string;
  matchScore: number;
};

export type SongSearchResponse = {
  results: SongResult[];
};

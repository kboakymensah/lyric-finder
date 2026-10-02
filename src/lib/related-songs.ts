import type { SavedSong, SongResult } from '../types/song';

type CatalogTrack = { trackId?: number | string; trackName?: string; artistName?: string; artworkUrl100?: string; previewUrl?: string; trackViewUrl?: string };
type CatalogResponse = { results?: CatalogTrack[] };
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function findRelatedSongs(song: SavedSong | SongResult, fetcher: Fetcher = fetch): Promise<SongResult[]> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', song.artist);
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', '8');

  try {
    const response = await fetcher(url);
    if (!response.ok) return [];
    const body = (await response.json()) as CatalogResponse;
    return (body.results ?? [])
      .filter((track) => track.trackId && track.trackName && track.artistName && track.previewUrl && track.trackViewUrl)
      .map((track) => ({
        id: String(track.trackId), title: track.trackName!, artist: track.artistName!, artworkUrl: track.artworkUrl100 ?? null, lyricsUrl: null, lyricSnippet: null, previewUrl: track.previewUrl!, listenUrl: track.trackViewUrl!, matchScore: 0,
      }))
      .filter((track) => track.id !== song.id && track.title.toLowerCase() !== song.title.toLowerCase())
      .slice(0, 4);
  } catch {
    return [];
  }
}

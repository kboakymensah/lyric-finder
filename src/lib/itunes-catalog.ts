import type { SongResult } from '../types/song';

type CatalogTrack = {
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

type CatalogResponse = {
  results?: CatalogTrack[];
};

type CatalogFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeTitle(value: string) {
  return normalizeText(value.replace(/\s*\([^)]*\)/g, ''));
}

function isComplete(song: SongResult) {
  return Boolean(song.previewUrl && song.listenUrl.includes('music.apple.com'));
}

export async function enrichMissingCatalog(
  song: SongResult,
  fetcher: CatalogFetcher = fetch,
): Promise<SongResult> {
  if (isComplete(song)) return song;

  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', `${song.title} ${song.artist}`);
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', '5');

  try {
    const response = await fetcher(url);
    if (!response.ok) return song;

    const body = (await response.json()) as CatalogResponse;
    const match = body.results?.find((track) =>
      track.trackName
      && track.artistName
      && normalizeTitle(track.trackName) === normalizeTitle(song.title)
      && normalizeText(track.artistName) === normalizeText(song.artist));

    if (!match) return song;

    return {
      ...song,
      artworkUrl: song.artworkUrl ?? match.artworkUrl100 ?? null,
      previewUrl: song.previewUrl ?? match.previewUrl ?? null,
      listenUrl: match.trackViewUrl ?? song.listenUrl,
    };
  } catch {
    return song;
  }
}

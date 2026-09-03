export type Fetcher = typeof fetch;

type LrcTrack = { id: number; trackName: string; artistName: string; plainLyrics?: string | null };
type CatalogTrack = { trackId: number; trackName: string; artistName: string; artworkUrl100?: string; previewUrl?: string; trackViewUrl?: string };

function snippet(lyrics?: string | null) {
  return lyrics?.split('\n').find((line) => line.trim())?.trim().slice(0, 160) ?? null;
}

export async function searchSongs(query: string, fetcher: Fetcher = fetch) {
  const lrcUrl = new URL('https://lrclib.net/api/search');
  lrcUrl.searchParams.set('q', query);
  const lrcResponse = await fetcher(lrcUrl, { headers: { 'Lrclib-Client': 'LyricFinder/1.0' } });
  if (!lrcResponse.ok) throw new Error('Lyrics search is temporarily unavailable.');
  const matches = (await lrcResponse.json() as LrcTrack[]).slice(0, 5);
  return Promise.all(matches.map(async (match, index) => {
    const catalogUrl = new URL('https://itunes.apple.com/search');
    catalogUrl.searchParams.set('term', `${match.trackName} ${match.artistName}`);
    catalogUrl.searchParams.set('entity', 'song');
    catalogUrl.searchParams.set('limit', '1');
    const catalogResponse = await fetcher(catalogUrl);
    const catalog = catalogResponse.ok ? ((await catalogResponse.json() as { results: CatalogTrack[] }).results[0]) : undefined;
    return { id: String(match.id), title: match.trackName, artist: match.artistName, artworkUrl: catalog?.artworkUrl100 ?? null, lyricSnippet: snippet(match.plainLyrics), previewUrl: catalog?.previewUrl ?? null, listenUrl: catalog?.trackViewUrl ?? `https://www.google.com/search?q=${encodeURIComponent(`${match.trackName} ${match.artistName} song`)}`, matchScore: Math.max(0, 100 - index * 12) };
  }));
}

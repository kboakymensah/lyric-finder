export type Fetcher = typeof fetch;

type LrcTrack = { id: number; trackName: string; artistName: string; plainLyrics?: string | null };
type CatalogTrack = { trackId: number; trackName: string; artistName: string; artworkUrl100?: string; previewUrl?: string; trackViewUrl?: string };

export function normalizeLyricQuery(query: string): string[] {
  const trimmed = query.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');
  return normalized === trimmed ? [trimmed] : [trimmed, normalized];
}

function lyricTokens(value?: string | null): string[] {
  return (value ?? '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
}

export function scoreLyricMatch(query: string, lyrics?: string | null): number {
  const queryTokens = [...new Set(lyricTokens(query))];
  if (!queryTokens.length) return 0;
  const lyricTokenSet = new Set(lyricTokens(lyrics));
  return Math.round((queryTokens.filter((token) => lyricTokenSet.has(token)).length / queryTokens.length) * 100);
}

function snippet(lyrics?: string | null) {
  return lyrics?.split('\n').find((line) => line.trim())?.trim().slice(0, 160) ?? null;
}

export async function searchSongs(query: string, fetcher: Fetcher = fetch) {
  const candidates = new Map<string, { match: LrcTrack; position: number }>();
  let position = 0;
  for (const variant of normalizeLyricQuery(query)) {
    const lrcUrl = new URL('https://lrclib.net/api/search');
    lrcUrl.searchParams.set('q', variant);
    const lrcResponse = await fetcher(lrcUrl, { headers: { 'Lrclib-Client': 'LyricFinder/1.0' } });
    if (!lrcResponse.ok) throw new Error('Lyrics search is temporarily unavailable.');
    const matches = await lrcResponse.json() as LrcTrack[];
    for (const match of Array.isArray(matches) ? matches : []) {
      if (!match || match.id == null || typeof match.trackName !== 'string' || typeof match.artistName !== 'string') continue;
      const key = `${match.trackName.trim().replace(/\s+/g, ' ').toLocaleLowerCase()}\u0000${match.artistName.trim().replace(/\s+/g, ' ').toLocaleLowerCase()}`;
      if (!candidates.has(key)) candidates.set(key, { match, position });
      position += 1;
    }
  }

  const matches = [...candidates.values()]
    .sort((left, right) => scoreLyricMatch(query, right.match.plainLyrics) - scoreLyricMatch(query, left.match.plainLyrics) || left.position - right.position)
    .slice(0, 5);

  return Promise.all(matches.map(async ({ match }) => {
    const catalogUrl = new URL('https://itunes.apple.com/search');
    catalogUrl.searchParams.set('term', `${match.trackName} ${match.artistName}`);
    catalogUrl.searchParams.set('entity', 'song');
    catalogUrl.searchParams.set('limit', '1');
    let catalog: CatalogTrack | undefined;
    try {
      const catalogResponse = await fetcher(catalogUrl);
      if (catalogResponse.ok) catalog = ((await catalogResponse.json() as { results?: CatalogTrack[] }).results ?? [])[0];
    } catch {
      catalog = undefined;
    }
    return { id: String(match.id), title: match.trackName, artist: match.artistName, artworkUrl: catalog?.artworkUrl100 ?? null, lyricSnippet: snippet(match.plainLyrics), previewUrl: catalog?.previewUrl ?? null, listenUrl: catalog?.trackViewUrl ?? `https://www.google.com/search?q=${encodeURIComponent(`${match.trackName} ${match.artistName} song`)}`, matchScore: scoreLyricMatch(query, match.plainLyrics) };
  }));
}

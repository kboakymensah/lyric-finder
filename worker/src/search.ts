export type Fetcher = typeof fetch;

type LrcTrack = { id: number; trackName: string; artistName: string; plainLyrics?: string | null };
type CatalogTrack = { trackId: number; trackName: string; artistName: string; artworkUrl100?: string; previewUrl?: string; trackViewUrl?: string };
type GeniusSong = { id: number; title: string; primary_artist: { name: string }; song_art_image_url?: string; url?: string };
type SearchOptions = { geniusAccessToken?: string };

export function normalizeLyricQuery(query: string): string[] {
  const trimmed = query.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');
  const variants = new Set([trimmed, normalized]);
  const contractionNormalized = normalized.replace(/\b(must|should|would|could|might) have\b/gi, "$1've");
  variants.add(contractionNormalized);
  const words = normalized.split(' ').filter(Boolean);
  if (words.length > 5) variants.add(words.slice(0, 5).join(' '));
  return [...variants];
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

async function enrichWithITunes(trackName: string, artistName: string, fetcher: Fetcher) {
  const catalogUrl = new URL('https://itunes.apple.com/search');
  catalogUrl.searchParams.set('term', `${trackName} ${artistName}`);
  catalogUrl.searchParams.set('entity', 'song');
  catalogUrl.searchParams.set('limit', '1');
  try {
    const catalogResponse = await fetcher(catalogUrl);
    if (!catalogResponse.ok) return undefined;
    return ((await catalogResponse.json() as { results?: CatalogTrack[] }).results ?? [])[0];
  } catch {
    return undefined;
  }
}

async function searchGenius(query: string, fetcher: Fetcher, accessToken?: string) {
  if (!accessToken) return [];
  try {
    const geniusUrl = new URL('https://api.genius.com/search');
    geniusUrl.searchParams.set('q', query);
    const response = await fetcher(geniusUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return [];
    const payload = await response.json() as { response?: { hits?: Array<{ result?: GeniusSong }> } };
    return (payload.response?.hits ?? []).map((hit) => hit.result).filter((song): song is GeniusSong =>
      Boolean(song && song.id != null && typeof song.title === 'string' && typeof song.primary_artist?.name === 'string'),
    ).slice(0, 5);
  } catch {
    return [];
  }
}

export async function searchSongs(query: string, fetcher: Fetcher = fetch, options: SearchOptions = {}) {
  const geniusMatches = await searchGenius(query, fetcher, options.geniusAccessToken);
  if (geniusMatches.length) return Promise.all(geniusMatches.map(async (match) => {
    const catalog = await enrichWithITunes(match.title, match.primary_artist.name, fetcher);
    return {
      id: String(match.id), title: match.title, artist: match.primary_artist.name,
      artworkUrl: match.song_art_image_url ?? catalog?.artworkUrl100 ?? null,
      lyricSnippet: null, previewUrl: catalog?.previewUrl ?? null,
      listenUrl: catalog?.trackViewUrl ?? match.url ?? `https://www.google.com/search?q=${encodeURIComponent(`${match.title} ${match.primary_artist.name} song`)}`,
      matchScore: 100,
    };
  }));

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
    const catalog = await enrichWithITunes(match.trackName, match.artistName, fetcher);
    return { id: String(match.id), title: match.trackName, artist: match.artistName, artworkUrl: catalog?.artworkUrl100 ?? null, lyricSnippet: snippet(match.plainLyrics), previewUrl: catalog?.previewUrl ?? null, listenUrl: catalog?.trackViewUrl ?? `https://www.google.com/search?q=${encodeURIComponent(`${match.trackName} ${match.artistName} song`)}`, matchScore: scoreLyricMatch(query, match.plainLyrics) };
  }));
}

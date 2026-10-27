import type { Fetcher } from './search';

export type TimedLyricLine = { timeSeconds: number; text: string };

function parseLines(value: string | null | undefined): TimedLyricLine[] {
  if (!value) return [];
  const tag = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g;
  const lines: TimedLyricLine[] = [];
  for (const raw of value.split(/\r?\n/)) {
    const text = raw.replace(tag, '').trim();
    if (!text) continue;
    for (const match of raw.matchAll(tag)) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      if (Number.isFinite(minutes) && Number.isFinite(seconds) && seconds < 60) lines.push({ timeSeconds: (minutes * 60) + seconds, text });
    }
  }
  return lines.sort((a, b) => a.timeSeconds - b.timeSeconds).slice(0, 500);
}

export async function lookupSyncedLyrics(title: string, artist: string, fetcher: Fetcher = fetch): Promise<{ lines: TimedLyricLine[]; plainLyrics: string | null }> {
  try {
    const url = new URL('https://lrclib.net/api/get');
    url.searchParams.set('track_name', title);
    url.searchParams.set('artist_name', artist);
    const response = await fetcher(url, { headers: { 'User-Agent': 'LyricFinder/1.0 (https://github.com/kboakymensah/lyric-finder)' } });
    if (!response.ok) return { lines: [], plainLyrics: null };
    const body = await response.json() as { plainLyrics?: string | null; syncedLyrics?: string | null };
    return { lines: parseLines(body.syncedLyrics), plainLyrics: body.plainLyrics?.trim() || null };
  } catch {
    return { lines: [], plainLyrics: null };
  }
}

import { parseSyncedLyrics, type TimedLyricLine } from './synced-lyrics';

type LrclibRecord = { plainLyrics?: unknown; syncedLyrics?: unknown };

export function parseLrclibLyrics(value: LrclibRecord): { lines: TimedLyricLine[]; plainLyrics: string | null } {
  const plainLyrics = typeof value.plainLyrics === 'string' && value.plainLyrics.trim() ? value.plainLyrics.trim() : null;
  return { lines: parseSyncedLyrics(typeof value.syncedLyrics === 'string' ? value.syncedLyrics : null), plainLyrics };
}

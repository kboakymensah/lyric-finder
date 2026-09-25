export type TimedLyricLine = {
  timeSeconds: number;
  text: string;
};

const timestampPattern = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g;

export function parseSyncedLyrics(value: string | null | undefined): TimedLyricLine[] {
  if (!value) return [];

  const lines: TimedLyricLine[] = [];
  for (const rawLine of value.split(/\r?\n/)) {
    const text = rawLine.replace(timestampPattern, '').trim();
    if (!text) continue;

    for (const match of rawLine.matchAll(timestampPattern)) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) continue;
      lines.push({ timeSeconds: (minutes * 60) + seconds, text });
    }
  }

  return lines.sort((left, right) => left.timeSeconds - right.timeSeconds);
}

export function activeLyricIndex(lines: TimedLyricLine[], currentSeconds: number): number | null {
  let active: number | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].timeSeconds > currentSeconds) break;
    active = index;
  }
  return active;
}

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { fetchWithTimeout } from '../../lib/request';
import { buildPreviewQueue, clampPreviewSeek, nextQueueIndex, previousQueueIndex } from '../lib/preview-queue';
import type { TimedLyricLine } from '../lib/synced-lyrics';
import type { SavedSong, SongResult } from '../types/song';

type PlayableSong = SongResult | SavedSong;
type PreviewPlayerValue = { currentSong: PlayableSong | null; currentIndex: number; queue: SavedSong[]; canNext: boolean; canPrevious: boolean; isPlaying: boolean; message: string | null; currentSeconds: number; lyricLines: TimedLyricLine[]; lyricLoading: boolean; lyricMessage: string | null; startSong(song: SongResult): void; startQueue(songs: SavedSong[]): void; toggleSong(song: SongResult): void; toggle(): void; next(): void; previous(): void; seekBy(seconds: number): Promise<void> };
const PreviewPlayerContext = createContext<PreviewPlayerValue | null>(null);

export function PreviewPlayerProvider({ children }: { children: ReactNode }) {
  const audio = useAudioPlayer(); const status = useAudioPlayerStatus(audio);
  const [queue, setQueue] = useState<SavedSong[]>([]); const [currentIndex, setCurrentIndex] = useState(0); const [single, setSingle] = useState<SongResult | null>(null); const [isPlaying, setIsPlaying] = useState(false); const [message, setMessage] = useState<string | null>(null); const [lyricLines, setLyricLines] = useState<TimedLyricLine[]>([]); const [lyricLoading, setLyricLoading] = useState(false); const [lyricMessage, setLyricMessage] = useState<string | null>(null); const lyricRequest = useRef(0); const handledFinish = useRef(false);
  const currentSong = single ?? queue[currentIndex] ?? null; const canPrevious = !single && currentIndex > 0; const canNext = !single && currentIndex < queue.length - 1;
  function play(song: PlayableSong) { if (!song.previewUrl) return; try { audio.replace(song.previewUrl); audio.play(); setIsPlaying(true); setMessage(null); } catch { setIsPlaying(false); setMessage('Playback could not start. Please try another preview.'); } }
  function startSong(song: SongResult) { setQueue([]); setCurrentIndex(0); setSingle(song); play(song); }
  function toggleSong(song: SongResult) { if (currentSong?.id === song.id) toggle(); else startSong(song); }
  function startQueue(songs: SavedSong[]) { const nextQueue = buildPreviewQueue(songs); setSingle(null); setQueue(nextQueue); setCurrentIndex(0); if (nextQueue[0]) play(nextQueue[0]); else { audio.pause(); setMessage('No 30-second previews are available in this collection yet.'); } }
  function toggle() { if (!currentSong) return; try { if (isPlaying) { audio.pause(); setIsPlaying(false); } else { audio.play(); setIsPlaying(true); } } catch { setIsPlaying(false); setMessage('Playback could not start. Please try another preview.'); } }
  function next() { if (!canNext) return; const index = nextQueueIndex(currentIndex, queue.length); setCurrentIndex(index); play(queue[index]); }
  function previous() { if (!canPrevious) return; const index = previousQueueIndex(currentIndex); setCurrentIndex(index); play(queue[index]); }
  async function seekBy(seconds: number) { try { await audio.seekTo(clampPreviewSeek(audio.currentTime + seconds, status.duration || audio.duration || 30)); } catch { setMessage('Playback could not start. Please try another preview.'); } }
  useEffect(() => { setIsPlaying(status.playing); }, [status.playing]);
  useEffect(() => { if (!status.error) return; audio.pause(); setIsPlaying(false); setMessage('Playback could not start. Please try another preview.'); }, [audio, status.error]);
  useEffect(() => { if (!status.didJustFinish) { handledFinish.current = false; return; } if (handledFinish.current || !canNext) return; handledFinish.current = true; const index = nextQueueIndex(currentIndex, queue.length); setCurrentIndex(index); play(queue[index]); }, [canNext, currentIndex, queue, status.didJustFinish]);
  useEffect(() => { if (!currentSong?.previewUrl) return; const request = ++lyricRequest.current; const base = process.env.EXPO_PUBLIC_API_BASE_URL; setLyricLines([]); setLyricMessage(null); if (!base) { setLyricMessage('Timed lyrics aren’t available for this song.'); return; } setLyricLoading(true); fetchWithTimeout(`${base}/lyrics`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: currentSong.title, artist: currentSong.artist }) }).then((r) => r.ok ? r.json() : { lines: [] }).then((body) => { if (request !== lyricRequest.current) return; const lines = Array.isArray(body.lines) ? body.lines : []; setLyricLines(lines); if (!lines.length) setLyricMessage('Timed lyrics aren’t available for this song.'); }).catch(() => { if (request === lyricRequest.current) setLyricMessage('Timed lyrics aren’t available for this song.'); }).finally(() => { if (request === lyricRequest.current) setLyricLoading(false); }); }, [currentSong?.id]);
  return <PreviewPlayerContext.Provider value={{ currentSong, currentIndex, queue, canNext, canPrevious, isPlaying, message, currentSeconds: status.currentTime, lyricLines, lyricLoading, lyricMessage, startSong, startQueue, toggleSong, toggle, next, previous, seekBy }}>{children}</PreviewPlayerContext.Provider>;
}
export function usePreviewPlayer() { const value = useContext(PreviewPlayerContext); if (!value) throw new Error('usePreviewPlayer must be used inside PreviewPlayerProvider'); return value; }

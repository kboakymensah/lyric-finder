import { useAudioPlaylist, useAudioPlaylistStatus, type AudioPlaylistLoopMode } from 'expo-audio';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchWithTimeout } from '../../lib/request';
import { buildPreviewQueue, clampPreviewSeek, shufflePreviewQueue, type PlaybackMode } from '../lib/preview-queue';
import { findRelatedSongs } from '../lib/related-songs';
import type { TimedLyricLine } from '../lib/synced-lyrics';
import type { SavedSong, SongResult } from '../types/song';

type PlayableSong = SongResult | SavedSong;
type PreviewPlayerValue = {
  currentSong: PlayableSong | null; currentIndex: number; queue: SavedSong[]; canNext: boolean; canPrevious: boolean;
  isPlaying: boolean; message: string | null; currentSeconds: number; durationSeconds: number; playbackMode: PlaybackMode;
  lyricLines: TimedLyricLine[]; lyricLoading: boolean; lyricMessage: string | null; relatedSongs: SongResult[]; relatedLoading: boolean;
  startSong(song: SongResult): void; startQueue(songs: SavedSong[]): void; toggleSong(song: SongResult): void; toggle(): void;
  next(): void; previous(): void; seekBy(seconds: number): Promise<void>; setPlaybackMode(mode: PlaybackMode): void; cyclePlaybackMode(): void;
};
const PreviewPlayerContext = createContext<PreviewPlayerValue | null>(null);

function nativeLoopMode(mode: PlaybackMode): AudioPlaylistLoopMode {
  if (mode === 'repeat-all' || mode === 'shuffle') return 'all';
  return mode === 'repeat-one' ? 'single' : 'none';
}

export function PreviewPlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SavedSong[]>([]);
  const [single, setSingle] = useState<SongResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('repeat-all');
  const [lyricLines, setLyricLines] = useState<TimedLyricLine[]>([]);
  const [lyricLoading, setLyricLoading] = useState(false);
  const [lyricMessage, setLyricMessage] = useState<string | null>(null);
  const [relatedSongs, setRelatedSongs] = useState<SongResult[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const lyricRequest = useRef(0);
  const shouldAutoplay = useRef(false);
  const playbackModeRef = useRef<PlaybackMode>('repeat-all');
  const activeSongs = useMemo<PlayableSong[]>(() => single ? [single] : queue, [queue, single]);
  const sources = useMemo(() => activeSongs.map((song) => song.previewUrl).filter((url): url is string => Boolean(url)), [activeSongs]);
  const playlist = useAudioPlaylist({ sources, loop: nativeLoopMode(playbackMode), updateInterval: 250 });
  const status = useAudioPlaylistStatus(playlist);
  const currentIndex = activeSongs.length ? Math.min(Math.max(status.currentIndex, 0), activeSongs.length - 1) : 0;
  const currentSong = activeSongs[currentIndex] ?? null;
  const canNext = !single && queue.length > 1 && (playbackMode !== 'normal' || currentIndex < queue.length - 1);
  const canPrevious = !single && queue.length > 1 && (playbackMode !== 'normal' || currentIndex > 0);

  useEffect(() => {
    if (!shouldAutoplay.current || !sources.length) return;
    try { playlist.play(); setMessage(null); } catch { setMessage('Playback could not start. Please try another preview.'); }
    shouldAutoplay.current = false;
  }, [playlist, sources.length]);

  function startSong(song: SongResult) {
    if (!song.previewUrl) { setMessage('A 30-second preview is not available for this song yet.'); return; }
    playlist.pause(); shouldAutoplay.current = true; setQueue([]); setSingle(song); setMessage(null);
  }
  function startQueue(songs: SavedSong[]) {
    const playableSongs = buildPreviewQueue(songs);
    const nextQueue = playbackModeRef.current === 'shuffle' ? shufflePreviewQueue(playableSongs) : playableSongs;
    playlist.pause();
    if (!nextQueue.length) { shouldAutoplay.current = false; setSingle(null); setQueue([]); setMessage('No 30-second previews are available in this collection yet.'); return; }
    shouldAutoplay.current = true; setSingle(null); setQueue(nextQueue); setMessage(null);
  }
  function toggleSong(song: SongResult) { if (currentSong?.id === song.id) toggle(); else startSong(song); }
  function toggle() {
    if (!currentSong) return;
    try { if (status.playing) playlist.pause(); else playlist.play(); setMessage(null); } catch { setMessage('Playback could not start. Please try another preview.'); }
  }
  function next() { if (!canNext) return; try { playlist.next(); } catch { setMessage('Playback could not start. Please try another preview.'); } }
  function previous() { if (!canPrevious) return; try { playlist.previous(); } catch { setMessage('Playback could not start. Please try another preview.'); } }
  function setMode(mode: PlaybackMode) { playbackModeRef.current = mode; setPlaybackMode(mode); }
  function cyclePlaybackMode() { const modes: PlaybackMode[] = ['repeat-all', 'repeat-one', 'shuffle', 'normal']; setMode(modes[(modes.indexOf(playbackMode) + 1) % modes.length]); }
  async function seekBy(seconds: number) {
    try { await playlist.seekTo(clampPreviewSeek(status.currentTime + seconds, status.duration || 30)); }
    catch { setMessage('Playback could not start. Please try another preview.'); }
  }

  useEffect(() => {
    if (!currentSong?.previewUrl) return;
    const request = ++lyricRequest.current; const base = process.env.EXPO_PUBLIC_API_BASE_URL;
    setLyricLines([]); setLyricMessage(null);
    if (!base) { setLyricMessage('Timed lyrics aren’t available for this song.'); return; }
    setLyricLoading(true);
    fetchWithTimeout(`${base}/lyrics`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: currentSong.title, artist: currentSong.artist }) })
      .then((response) => response.ok ? response.json() : { lines: [] })
      .then((body) => { if (request !== lyricRequest.current) return; const lines = Array.isArray(body.lines) ? body.lines : []; setLyricLines(lines); if (!lines.length) setLyricMessage('Timed lyrics aren’t available for this song.'); })
      .catch(() => { if (request === lyricRequest.current) setLyricMessage('Timed lyrics aren’t available for this song.'); })
      .finally(() => { if (request === lyricRequest.current) setLyricLoading(false); });
  }, [currentSong?.id, currentSong?.previewUrl]);
  useEffect(() => {
    if (!currentSong) { setRelatedSongs([]); return; }
    let active = true; setRelatedLoading(true);
    void findRelatedSongs(currentSong).then((songs) => { if (active) setRelatedSongs(songs); }).finally(() => { if (active) setRelatedLoading(false); });
    return () => { active = false; };
  }, [currentSong?.id]);

  return <PreviewPlayerContext.Provider value={{ currentSong, currentIndex, queue, canNext, canPrevious, isPlaying: status.playing, message, currentSeconds: status.currentTime, durationSeconds: status.duration || 30, playbackMode, lyricLines, lyricLoading, lyricMessage, relatedSongs, relatedLoading, startSong, startQueue, toggleSong, toggle, next, previous, seekBy, setPlaybackMode: setMode, cyclePlaybackMode }}>{children}</PreviewPlayerContext.Provider>;
}
export function usePreviewPlayer() { const value = useContext(PreviewPlayerContext); if (!value) throw new Error('usePreviewPlayer must be used inside PreviewPlayerProvider'); return value; }

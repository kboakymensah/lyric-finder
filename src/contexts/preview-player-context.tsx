import { useAudioPlaylist, useAudioPlaylistStatus, type AudioPlaylistLoopMode } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchWithTimeout } from '../../lib/request';
import { buildPreviewQueue, clampPreviewSeek, shufflePreviewQueue, type PlaybackMode } from '../lib/preview-queue';
import { findRelatedSongs } from '../lib/related-songs';
import { addRecentlyPlayed, parseRecentlyPlayed } from '../lib/recently-played';
import type { TimedLyricLine } from '../lib/synced-lyrics';
import type { SavedSong, SongResult } from '../types/song';

type PlayableSong = SongResult | SavedSong;
type LibraryQueueSource = 'liked' | 'favorites';
type PreviewPlayerValue = {
  currentSong: PlayableSong | null; currentIndex: number; queue: SavedSong[]; canNext: boolean; canPrevious: boolean;
  isPlaying: boolean; message: string | null; currentSeconds: number; durationSeconds: number; playbackMode: PlaybackMode;
  lyricLines: TimedLyricLine[]; lyricLoading: boolean; lyricMessage: string | null; relatedSongs: SongResult[]; relatedLoading: boolean; recentlyPlayed: SavedSong[];
  libraryQueueSource: LibraryQueueSource | null; startSong(song: SongResult): void; startQueue(songs: SavedSong[]): void; startLibraryQueue(songs: SavedSong[], source: LibraryQueueSource): void; refreshLibraryQueue(songs: SavedSong[]): void; toggleSong(song: SongResult): void; toggle(): void;
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
  const [libraryQueueSource, setLibraryQueueSource] = useState<LibraryQueueSource | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('repeat-all');
  const [lyricLines, setLyricLines] = useState<TimedLyricLine[]>([]);
  const [lyricLoading, setLyricLoading] = useState(false);
  const [lyricMessage, setLyricMessage] = useState<string | null>(null);
  const [relatedSongs, setRelatedSongs] = useState<SongResult[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SavedSong[]>([]);
  const lyricRequest = useRef(0);
  const shouldAutoplay = useRef(false);
  const playbackModeRef = useRef<PlaybackMode>('repeat-all');
  const pendingQueueRestore = useRef<{ index: number; seconds: number; shouldPlay: boolean } | null>(null);
  const activeSongs = useMemo<PlayableSong[]>(() => single ? [single] : queue, [queue, single]);
  const sources = useMemo(() => activeSongs.map((song) => song.previewUrl).filter((url): url is string => Boolean(url)), [activeSongs]);
  const playlist = useAudioPlaylist({ sources, loop: nativeLoopMode(playbackMode), updateInterval: 250 });
  const status = useAudioPlaylistStatus(playlist);
  const currentIndex = activeSongs.length ? Math.min(Math.max(status.currentIndex, 0), activeSongs.length - 1) : 0;
  const currentSong = activeSongs[currentIndex] ?? null;
  const canNext = !single && queue.length > 1 && (playbackMode !== 'normal' || currentIndex < queue.length - 1);
  const canPrevious = !single && queue.length > 1 && (playbackMode !== 'normal' || currentIndex > 0);

  useEffect(() => {
    void AsyncStorage.getItem('@lyric-finder/recently-played-v1')
      .then((stored) => setRecentlyPlayed(stored ? parseRecentlyPlayed(stored) : []))
      .catch(() => setRecentlyPlayed([]));
  }, []);

  useEffect(() => {
    if (!currentSong) return;
    const savedSong: SavedSong = {
      id: currentSong.id, title: currentSong.title, artist: currentSong.artist, artworkUrl: currentSong.artworkUrl,
      lyricsUrl: currentSong.lyricsUrl, previewUrl: currentSong.previewUrl, listenUrl: currentSong.listenUrl,
    };
    setRecentlyPlayed((history) => {
      const next = addRecentlyPlayed(history, savedSong);
      void AsyncStorage.setItem('@lyric-finder/recently-played-v1', JSON.stringify(next));
      return next;
    });
  }, [currentSong?.id]);

  useEffect(() => {
    if (!shouldAutoplay.current || !sources.length) return;
    try { playlist.play(); setMessage(null); } catch { setMessage('Playback could not start. Please try another preview.'); }
    shouldAutoplay.current = false;
  }, [playlist, sources.length]);

  useEffect(() => {
    const restore = pendingQueueRestore.current;
    if (!restore || !sources.length) return;
    pendingQueueRestore.current = null;
    try {
      playlist.skipTo(Math.min(restore.index, sources.length - 1));
      void playlist.seekTo(restore.seconds);
      if (restore.shouldPlay) playlist.play();
    } catch {
      setMessage('Playback could not continue after your library changed.');
    }
  }, [playlist, sources]);

  function startSong(song: SongResult) {
    if (!song.previewUrl) { setMessage('A 30-second preview is not available for this song yet.'); return; }
    playlist.pause(); shouldAutoplay.current = true; setLibraryQueueSource(null); setQueue([]); setSingle(song); setMessage(null);
  }
  function beginQueue(songs: SavedSong[]) {
    const playableSongs = buildPreviewQueue(songs);
    const nextQueue = playbackModeRef.current === 'shuffle' ? shufflePreviewQueue(playableSongs) : playableSongs;
    playlist.pause();
    if (!nextQueue.length) { shouldAutoplay.current = false; setSingle(null); setQueue([]); setMessage('No 30-second previews are available in this collection yet.'); return; }
    shouldAutoplay.current = true; setSingle(null); setQueue(nextQueue); setMessage(null);
  }
  function startQueue(songs: SavedSong[]) { setLibraryQueueSource(null); beginQueue(songs); }
  function startLibraryQueue(songs: SavedSong[], source: LibraryQueueSource) { setLibraryQueueSource(source); beginQueue(songs); }
  function refreshLibraryQueue(songs: SavedSong[]) {
    if (!libraryQueueSource || single) return;
    const playableSongs = buildPreviewQueue(songs);
    const nextQueue = playbackModeRef.current === 'shuffle'
      ? [
          ...queue.filter((song) => playableSongs.some((playable) => playable.id === song.id)),
          ...shufflePreviewQueue(playableSongs.filter((song) => !queue.some((queued) => queued.id === song.id))),
        ]
      : playableSongs;
    if (!nextQueue.length || nextQueue.map((song) => song.id).join('|') === queue.map((song) => song.id).join('|')) return;
    const songIndex = currentSong ? nextQueue.findIndex((song) => song.id === currentSong.id) : -1;
    pendingQueueRestore.current = { index: songIndex >= 0 ? songIndex : 0, seconds: status.currentTime, shouldPlay: status.playing };
    setQueue(nextQueue);
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

  return <PreviewPlayerContext.Provider value={{ currentSong, currentIndex, queue, canNext, canPrevious, isPlaying: status.playing, message, currentSeconds: status.currentTime, durationSeconds: status.duration || 30, playbackMode, lyricLines, lyricLoading, lyricMessage, relatedSongs, relatedLoading, recentlyPlayed, libraryQueueSource, startSong, startQueue, startLibraryQueue, refreshLibraryQueue, toggleSong, toggle, next, previous, seekBy, setPlaybackMode: setMode, cyclePlaybackMode }}>{children}</PreviewPlayerContext.Provider>;
}
export function usePreviewPlayer() { const value = useContext(PreviewPlayerContext); if (!value) throw new Error('usePreviewPlayer must be used inside PreviewPlayerProvider'); return value; }

import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const nativePlaylist = vi.hoisted(() => ({
  sources: [] as string[],
  play: vi.fn(), pause: vi.fn(), next: vi.fn(), previous: vi.fn(), seekTo: vi.fn(), skipTo: vi.fn(),
}));
const nativeStatus = vi.hoisted(() => ({ currentIndex: 0, trackCount: 0, currentTime: 0, duration: 30, playing: false, error: null }));
const storage = vi.hoisted(() => ({ getItem: vi.fn().mockResolvedValue(null), setItem: vi.fn().mockResolvedValue(undefined) }));

vi.mock('expo-audio', () => ({
  useAudioPlaylist: ({ sources }: { sources?: string[] }) => {
    nativePlaylist.sources = sources ?? [];
    return nativePlaylist;
  },
  useAudioPlaylistStatus: () => nativeStatus,
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));

import { PreviewPlayerProvider, usePreviewPlayer } from './preview-player-context';

const song = { id: '1', title: 'Hello', artist: 'Adele', artworkUrl: null, lyricsUrl: null, lyricSnippet: null, previewUrl: 'https://example.com/a.m4a', listenUrl: 'https://music.apple.com/a', matchScore: 1 };
const nextSong = { ...song, id: '2', title: 'Rolling in the Deep', previewUrl: 'https://example.com/b.m4a' };

describe('PreviewPlayerProvider', () => {
  function renderPlayer() {
    let player: ReturnType<typeof usePreviewPlayer> | undefined;
    const Consumer = () => { player = usePreviewPlayer(); return null; };
    let tree: ReturnType<typeof create> | undefined;
    act(() => { tree = create(<PreviewPlayerProvider><Consumer /></PreviewPlayerProvider>); });
    return { tree: tree!, Consumer, player: () => player! };
  }

  it('starts a playable song', () => {
    const rendered = renderPlayer();
    act(() => rendered.player().startSong(song));
    expect(rendered.player().currentSong).toEqual(song);
    expect(rendered.player().durationSeconds).toBe(30);
  });

  it('uses the native playlist status to show the track reached after a queue advances', () => {
    nativeStatus.currentIndex = 0;
    const rendered = renderPlayer();
    act(() => rendered.player().startQueue([song, nextSong]));
    expect(rendered.player().currentSong).toEqual(song);

    nativeStatus.currentIndex = 1;
    act(() => rendered.tree.update(<PreviewPlayerProvider><rendered.Consumer /></PreviewPlayerProvider>));
    expect(rendered.player().currentSong).toEqual(nextSong);
  });

  it('replaces a library queue with one source when a result preview starts', () => {
    const rendered = renderPlayer();
    act(() => rendered.player().startQueue([song, nextSong]));
    act(() => rendered.player().startSong(song));

    expect(rendered.player().queue).toEqual([]);
    expect(nativePlaylist.sources).toEqual([song.previewUrl]);
  });

  it('refreshes an active library queue without losing the current song', () => {
    nativeStatus.currentIndex = 1;
    nativeStatus.currentTime = 12;
    nativeStatus.playing = true;
    const rendered = renderPlayer();
    act(() => rendered.player().startLibraryQueue([song, nextSong], 'liked'));
    act(() => rendered.player().refreshLibraryQueue([song, nextSong, { ...song, id: '3', title: 'New favorite', previewUrl: 'https://example.com/c.m4a' }]));

    expect(rendered.player().currentSong).toEqual(nextSong);
    expect(rendered.player().queue).toHaveLength(3);
  });

  it('keeps the shuffled order stable when the library has not changed', () => {
    nativeStatus.currentIndex = 0;
    nativeStatus.currentTime = 0;
    nativeStatus.playing = false;
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
    const rendered = renderPlayer();
    act(() => rendered.player().setPlaybackMode('shuffle'));
    act(() => rendered.player().startLibraryQueue([song, nextSong], 'liked'));
    const firstOrder = rendered.player().queue.map((item) => item.id);

    act(() => rendered.player().refreshLibraryQueue([song, nextSong]));

    expect(rendered.player().queue.map((item) => item.id)).toEqual(firstOrder);
    random.mockRestore();
  });
});

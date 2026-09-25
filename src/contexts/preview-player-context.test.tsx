import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-audio', () => ({ useAudioPlayer: () => ({ replace: vi.fn(), play: vi.fn(), pause: vi.fn(), currentTime: 0, duration: 30, seekTo: vi.fn() }), useAudioPlayerStatus: () => ({ currentTime: 0, duration: 30, playing: false, didJustFinish: false, error: null }) }));

import { PreviewPlayerProvider, usePreviewPlayer } from './preview-player-context';

const song = { id: '1', title: 'Hello', artist: 'Adele', artworkUrl: null, lyricsUrl: null, lyricSnippet: null, previewUrl: 'https://example.com/a.m4a', listenUrl: 'https://music.apple.com/a', matchScore: 1 };

describe('PreviewPlayerProvider', () => {
  it('starts a playable song', () => {
    let player: ReturnType<typeof usePreviewPlayer> | undefined;
    const Consumer = () => { player = usePreviewPlayer(); return null; };
    act(() => { create(<PreviewPlayerProvider><Consumer /></PreviewPlayerProvider>); });
    act(() => player!.startSong(song));
    expect(player!.currentSong).toEqual(song);
  });
});

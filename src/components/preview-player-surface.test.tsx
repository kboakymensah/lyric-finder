import { act, create } from 'react-test-renderer';
import { View } from 'react-native';
import { describe, expect, it, vi } from 'vitest';

const player = vi.hoisted(() => ({
  currentSong: { id: '1', title: 'Golden Hour', artist: 'The Artist', artworkUrl: null, lyricsUrl: null, lyricSnippet: null, previewUrl: 'https://example.com/a.mp3', listenUrl: 'https://example.com', matchScore: 1 },
  currentIndex: 0, queue: [], canNext: true, canPrevious: true, isPlaying: false, message: null, currentSeconds: 0, durationSeconds: 30,
  playbackMode: 'repeat-all' as const, lyricLines: [], lyricLoading: false, lyricMessage: null, relatedSongs: [], relatedLoading: false,
  toggle: vi.fn(), next: vi.fn(), previous: vi.fn(), seekBy: vi.fn(), cyclePlaybackMode: vi.fn(), startSong: vi.fn(),
}));

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({ Pressable: 'Pressable', StyleSheet: { create: <T,>(styles: T) => styles }, Text: 'Text', View: 'View' }));
vi.mock('../contexts/preview-player-context', () => ({ usePreviewPlayer: () => player }));
vi.mock('../contexts/library-context', () => ({ useLibrary: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }) }));
vi.mock('./playlist-preview-player', () => ({ PlaylistPreviewPlayer: (props: { visible: boolean }) => <MockModal {...props} /> }));

function MockModal({ visible }: { visible: boolean }) { return <View accessibilityLabel={visible ? 'now-playing-open' : 'now-playing-closed'} testID="mock-modal" />; }

import { PreviewPlayerSurface } from './preview-player-surface';

describe('PreviewPlayerSurface', () => {
  it('keeps Now Playing separate from mini-player playback controls', () => {
    let screen: ReturnType<typeof create>;
    act(() => { screen = create(<PreviewPlayerSurface />); });

    expect(screen!.root.findByProps({ testID: 'mock-modal' }).props.accessibilityLabel).toBe('now-playing-closed');
    act(() => screen!.root.findByProps({ accessibilityLabel: 'Play preview' }).props.onPress());
    expect(player.toggle).toHaveBeenCalledTimes(1);
    expect(screen!.root.findByProps({ testID: 'mock-modal' }).props.accessibilityLabel).toBe('now-playing-closed');

    act(() => screen!.root.findByProps({ accessibilityLabel: 'Open now playing' }).props.onPress());
    expect(screen!.root.findByProps({ testID: 'mock-modal' }).props.accessibilityLabel).toBe('now-playing-open');
    act(() => screen!.root.findByProps({ accessibilityLabel: 'Previous preview' }).props.onPress());
    act(() => screen!.root.findByProps({ accessibilityLabel: 'Next preview' }).props.onPress());
    expect(player.previous).toHaveBeenCalledTimes(1);
    expect(player.next).toHaveBeenCalledTimes(1);
  });
});

import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  View: 'View',
}));

import { PlaylistPreviewPlayer } from './playlist-preview-player';
import type { SavedSong } from '../types/song';

const song: SavedSong = {
  id: 'song-1',
  title: 'Golden Hour',
  artist: 'The Artist',
  artworkUrl: null,
  lyricsUrl: null,
  previewUrl: 'https://example.com/preview.m4a',
  listenUrl: 'https://music.apple.com/example',
};

const callbacks = {
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onSeekBack: vi.fn(),
  onSeekForward: vi.fn(),
  onToggle: vi.fn(),
};

describe('PlaylistPreviewPlayer', () => {
  it('disables Previous at the first queue item and Next at the final queue item', () => {
    let player: ReturnType<typeof create>;
    act(() => {
      player = create(
        <PlaylistPreviewPlayer
          canNext={false}
          canPrevious={false}
          currentIndex={0}
          currentSong={song}
          isPlaying={false}
          message={null}
          queueLength={1}
          {...callbacks}
        />,
      );
    });

    expect(player!.root.findByProps({ accessibilityLabel: 'Previous preview' }).props.disabled).toBe(true);
    expect(player!.root.findByProps({ accessibilityLabel: 'Next preview' }).props.disabled).toBe(true);
  });

  it('renders a readable playback error', () => {
    let player: ReturnType<typeof create>;
    act(() => {
      player = create(
        <PlaylistPreviewPlayer
          canNext={false}
          canPrevious={false}
          currentIndex={0}
          currentSong={song}
          isPlaying={false}
          message="Playback could not start. Please try another preview."
          queueLength={1}
          {...callbacks}
        />,
      );
    });

    const text = player!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''));
    expect(text).toContain('Playback could not start. Please try another preview.');
  });
});

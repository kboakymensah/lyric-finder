import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import type { SavedSong } from '../types/song';
import { usePlaylistPreviewPlayer } from './use-playlist-preview-player';

const player = {
  currentTime: 5,
  duration: 30,
  pause: vi.fn(),
  play: vi.fn(),
  replace: vi.fn(),
};

vi.mock('expo-audio', () => ({
  useAudioPlayer: () => player,
  useAudioPlayerStatus: () => ({ currentTime: player.currentTime, duration: player.duration }),
}));

const playableSong: SavedSong = {
  id: 'playable',
  title: 'Playable song',
  artist: 'The Artist',
  artworkUrl: null,
  lyricsUrl: null,
  previewUrl: 'https://example.com/preview.m4a',
  listenUrl: 'https://music.apple.com/example',
};

describe('usePlaylistPreviewPlayer', () => {
  it('starts the first available preview and skips songs without previews', () => {
    const unavailableSong = { ...playableSong, id: 'unavailable', previewUrl: null };
    let previewPlayer: ReturnType<typeof usePlaylistPreviewPlayer> | undefined;
    const Consumer = () => {
      previewPlayer = usePlaylistPreviewPlayer();
      return null;
    };

    act(() => {
      create(<Consumer />);
    });

    act(() => previewPlayer!.start([unavailableSong, playableSong]));

    expect(previewPlayer!.currentSong).toEqual(playableSong);
    expect(player.replace).toHaveBeenCalledWith(playableSong.previewUrl);
    expect(player.play).toHaveBeenCalled();
  });
});

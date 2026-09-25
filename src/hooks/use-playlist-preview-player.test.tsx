import { act, create } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedSong } from '../types/song';
import { usePlaylistPreviewPlayer } from './use-playlist-preview-player';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { player, status } = vi.hoisted(() => ({
  player: {
    currentTime: 5,
    duration: 30,
    pause: vi.fn(),
    play: vi.fn(),
    replace: vi.fn(),
    seekTo: vi.fn(),
  },
  status: {
    currentTime: 5,
    didJustFinish: false,
    duration: 30,
    error: null as string | null,
    playing: false,
  },
}));

vi.mock('expo-audio', () => ({
  useAudioPlayer: () => player,
  useAudioPlayerStatus: () => status,
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
  beforeEach(() => {
    player.currentTime = 5;
    player.duration = 30;
    player.pause.mockReset();
    player.play.mockReset();
    player.replace.mockReset();
    player.seekTo.mockReset();
    status.currentTime = 5;
    status.didJustFinish = false;
    status.duration = 30;
    status.error = null;
    status.playing = false;
  });

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

  it('shows an error when the audio status reports a failed source', () => {
    let previewPlayer: ReturnType<typeof usePlaylistPreviewPlayer> | undefined;
    const Consumer = () => {
      previewPlayer = usePlaylistPreviewPlayer();
      return null;
    };
    let renderer: ReturnType<typeof create>;

    act(() => {
      renderer = create(<Consumer />);
    });

    act(() => {
      previewPlayer!.start([playableSong]);
    });

    act(() => {
      status.error = 'preview failed to load';
      renderer!.update(<Consumer />);
    });

    expect(previewPlayer!.message).toBe('Playback could not start. Please try another preview.');
    expect(previewPlayer!.isPlaying).toBe(false);
  });

  it('advances only one item for one finished-preview event', () => {
    const secondSong = { ...playableSong, id: 'second', title: 'Second song' };
    const thirdSong = { ...playableSong, id: 'third', title: 'Third song' };
    let previewPlayer: ReturnType<typeof usePlaylistPreviewPlayer> | undefined;
    const Consumer = () => {
      previewPlayer = usePlaylistPreviewPlayer();
      return null;
    };
    let renderer: ReturnType<typeof create>;

    act(() => {
      renderer = create(<Consumer />);
    });

    act(() => {
      previewPlayer!.start([playableSong, secondSong, thirdSong]);
    });

    act(() => {
      status.didJustFinish = true;
      renderer!.update(<Consumer />);
    });

    expect(previewPlayer!.currentSong).toEqual(secondSong);
  });

  it('seeks forward before Expo has reported the preview duration', async () => {
    player.currentTime = 5;
    player.duration = 0;
    status.duration = 0;
    let previewPlayer: ReturnType<typeof usePlaylistPreviewPlayer> | undefined;
    const Consumer = () => {
      previewPlayer = usePlaylistPreviewPlayer();
      return null;
    };

    act(() => {
      create(<Consumer />);
    });
    act(() => {
      previewPlayer!.start([playableSong]);
    });

    await act(async () => {
      await previewPlayer!.seekBy(10);
    });

    expect(player.seekTo).toHaveBeenCalledWith(15);
  });
});

import { useAudioPlayer } from 'expo-audio';
import { useState } from 'react';

import type { SongResult } from '../types/song';

export function usePreviewPlayer(): {
  playingId: string | null;
  togglePreview: (song: SongResult) => void;
} {
  const player = useAudioPlayer();
  const [playingId, setPlayingId] = useState<string | null>(null);

  function togglePreview(song: SongResult) {
    if (!song.previewUrl) return;

    if (playingId === song.id) {
      player.pause();
      setPlayingId(null);
      return;
    }

    player.replace(song.previewUrl);
    player.play();
    setPlayingId(song.id);
  }

  return { playingId, togglePreview };
}

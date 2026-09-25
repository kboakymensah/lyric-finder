import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { buildPreviewQueue, clampPreviewSeek, nextQueueIndex, previousQueueIndex } from '../lib/preview-queue';
import type { SavedSong } from '../types/song';

const playbackError = 'Playback could not start. Please try another preview.';
const noPreviewMessage = 'No 30-second previews are available in this collection yet.';

export function usePlaylistPreviewPlayer() {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [queue, setQueue] = useState<SavedSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handledFinishRef = useRef(false);
  const currentSong = queue[currentIndex] ?? null;
  const canPrevious = currentIndex > 0;
  const canNext = currentIndex < queue.length - 1;

  function playSong(song: SavedSong) {
    if (!song.previewUrl) return;

    try {
      player.replace(song.previewUrl);
      player.play();
      setIsPlaying(true);
      setMessage(null);
    } catch {
      setIsPlaying(false);
      setMessage(playbackError);
    }
  }

  function start(songs: SavedSong[]) {
    const nextQueue = buildPreviewQueue(songs);
    setQueue(nextQueue);
    setCurrentIndex(0);

    const firstSong = nextQueue[0];
    if (!firstSong) {
      player.pause();
      setIsPlaying(false);
      setMessage(noPreviewMessage);
      return;
    }

    playSong(firstSong);
  }

  function toggle() {
    if (!currentSong) return;

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
      setMessage(playbackError);
    }
  }

  function next() {
    if (!canNext) return;
    const nextIndex = nextQueueIndex(currentIndex, queue.length);
    setCurrentIndex(nextIndex);
    playSong(queue[nextIndex]);
  }

  function previous() {
    if (!canPrevious) return;
    const previousIndex = previousQueueIndex(currentIndex);
    setCurrentIndex(previousIndex);
    playSong(queue[previousIndex]);
  }

  function seekBy(deltaSeconds: number) {
    if (!currentSong) return;

    try {
      const duration = status.duration || player.duration || 0;
      player.currentTime = clampPreviewSeek(player.currentTime + deltaSeconds, duration);
    } catch {
      setMessage(playbackError);
    }
  }

  useEffect(() => {
    setIsPlaying(status.playing);
  }, [status.playing]);

  useEffect(() => {
    if (!status.error) return;
    player.pause();
    setIsPlaying(false);
    setMessage(playbackError);
  }, [player, status.error]);

  useEffect(() => {
    if (!status.didJustFinish) {
      handledFinishRef.current = false;
      return;
    }
    if (handledFinishRef.current) return;
    handledFinishRef.current = true;

    if (!canNext) {
      setIsPlaying(false);
      return;
    }

    const nextIndex = nextQueueIndex(currentIndex, queue.length);
    setCurrentIndex(nextIndex);
    playSong(queue[nextIndex]);
  }, [canNext, currentIndex, queue, status.didJustFinish]);

  useEffect(() => () => player.pause(), [player]);

  return {
    canNext,
    canPrevious,
    currentIndex,
    currentSong,
    duration: status.duration,
    isPlaying,
    message,
    next,
    previous,
    queue,
    seekBy,
    start,
    toggle,
  };
}

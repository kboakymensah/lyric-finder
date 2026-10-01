import { Image } from 'expo-image';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import type { TimedLyricLine } from '../lib/synced-lyrics';
import type { SavedSong, SongResult } from '../types/song';
import { SyncedLyrics } from './synced-lyrics';

type PlaylistPreviewPlayerProps = {
  canNext: boolean;
  canPrevious: boolean;
  currentIndex: number;
  currentSong: SavedSong | SongResult | null;
  durationSeconds?: number;
  isPlaying: boolean;
  message: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onToggle: () => void;
  queueLength: number;
  lyricLines?: TimedLyricLine[];
  lyricLoading?: boolean;
  lyricMessage?: string | null;
  currentSeconds?: number;
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export function PlaylistPreviewPlayer({
  canNext,
  canPrevious,
  currentIndex,
  currentSong,
  currentSeconds = 0,
  durationSeconds = 30,
  isPlaying,
  message,
  onNext,
  onPrevious,
  onSeekBack,
  onSeekForward,
  onToggle,
  queueLength,
  lyricLines = [],
  lyricLoading = false,
  lyricMessage = null,
}: PlaylistPreviewPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const duration = Math.max(1, durationSeconds || 30);
  const elapsed = Math.min(Math.max(currentSeconds, 0), duration);
  const progress = useMemo(() => `${(elapsed / duration) * 100}%` as `${number}%`, [duration, elapsed]);

  useEffect(() => {
    if (currentSong) setIsOpen(true);
  }, [currentSong?.id]);

  if (!currentSong && !message) return null;

  return (
    <>
      {currentSong && <Pressable accessibilityRole="button" accessibilityLabel="Open now playing" onPress={() => setIsOpen(true)} style={styles.miniPlayer}>
        {currentSong.artworkUrl ? <Image source={{ uri: currentSong.artworkUrl }} style={styles.miniArtwork} /> : <View style={styles.miniArtworkFallback}><Text style={styles.miniNote}>♫</Text></View>}
        <View style={styles.miniDetails}><Text numberOfLines={1} style={styles.miniTitle}>{currentSong.title}</Text><Text numberOfLines={1} style={styles.miniArtist}>{currentSong.artist}</Text></View>
        <Text style={styles.miniPlaying}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </Pressable>}
      <Modal animationType="slide" onRequestClose={() => setIsOpen(false)} transparent={false} visible={isOpen}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close now playing" hitSlop={10} onPress={() => setIsOpen(false)}><Text style={styles.close}>⌄</Text></Pressable>
            <Text style={styles.kicker}>NOW PLAYING</Text>
            <View style={styles.topSpacer} />
          </View>
          {currentSong && <View style={styles.content}>
            {currentSong.artworkUrl ? <Image source={{ uri: currentSong.artworkUrl }} style={styles.artwork} /> : <View style={styles.artworkFallback}><Text style={styles.note}>♫</Text></View>}
            <View style={styles.songRow}>
              <View style={styles.songDetails}><Text numberOfLines={2} style={styles.title}>{currentSong.title}</Text><Text numberOfLines={1} style={styles.artist}>{currentSong.artist}</Text></View>
              <Text accessibilityLabel="Preview favorite indicator" style={styles.star}>☆</Text>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: progress }]} /></View>
            <View style={styles.timeRow}><Text style={styles.time}>{formatTime(elapsed)}</Text><Text style={styles.time}>−{formatTime(duration - elapsed)}</Text></View>
            <View style={styles.controls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous preview" disabled={!canPrevious} onPress={onPrevious} style={[styles.control, !canPrevious && styles.disabled]}><Text style={styles.controlText}>⏮</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Back 10 seconds" onPress={onSeekBack} style={styles.control}><Text style={styles.controlText}>⏪</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'} onPress={onToggle} style={styles.playControl}><Text style={styles.playText}>{isPlaying ? 'Ⅱ' : '▶'}</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Forward 10 seconds" onPress={onSeekForward} style={styles.control}><Text style={styles.controlText}>⏩</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next preview" disabled={!canNext} onPress={onNext} style={[styles.control, !canNext && styles.disabled]}><Text style={styles.controlText}>⏭</Text></Pressable>
            </View>
            <Text style={styles.previewNote}>30-SECOND PREVIEW</Text>
            <SyncedLyrics lines={lyricLines} currentSeconds={elapsed} isLoading={lyricLoading} message={lyricMessage} />
          </View>}
          {message && <Text style={styles.message}>{message}</Text>}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  miniPlayer: { alignItems: 'center', backgroundColor: '#25231C', borderColor: '#F7C948', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  miniArtwork: { borderRadius: 8, height: 48, width: 48 }, miniArtworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 8, height: 48, justifyContent: 'center', width: 48 }, miniNote: { color: '#0B0B0A', fontSize: 22, fontWeight: '800' }, miniDetails: { flex: 1 }, miniTitle: { color: '#FFF7DF', fontWeight: '800' }, miniArtist: { color: '#D8CFB6', marginTop: 2 }, miniPlaying: { color: '#F7C948', fontSize: 22 },
  screen: { backgroundColor: '#12110E', flex: 1 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 }, topSpacer: { width: 24 }, close: { color: '#FFF7DF', fontSize: 32, lineHeight: 28 }, kicker: { color: '#F7C948', fontSize: 12, fontWeight: '900', letterSpacing: 2 }, content: { flex: 1, gap: 16, justifyContent: 'center', padding: 28 }, artwork: { alignSelf: 'center', borderRadius: 18, height: 300, maxWidth: 300, width: '100%' }, artworkFallback: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#F7C948', borderRadius: 18, height: 300, justifyContent: 'center', maxWidth: 300, width: '100%' }, note: { color: '#0B0B0A', fontSize: 96, fontWeight: '900' },
  songRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 12 }, songDetails: { flex: 1 }, title: { color: '#FFF7DF', fontSize: 25, fontWeight: '900' }, artist: { color: '#D8CFB6', fontSize: 18, marginTop: 4 }, star: { color: '#F7C948', fontSize: 38 }, progressTrack: { backgroundColor: '#575141', borderRadius: 5, height: 8, marginTop: 12, overflow: 'hidden' }, progressFill: { backgroundColor: '#F7C948', height: '100%' }, timeRow: { flexDirection: 'row', justifyContent: 'space-between' }, time: { color: '#BDB6A4', fontSize: 13, fontVariant: ['tabular-nums'] },
  controls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, control: { alignItems: 'center', height: 52, justifyContent: 'center', width: 48 }, controlText: { color: '#FFF7DF', fontSize: 27 }, playControl: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 34, height: 68, justifyContent: 'center', width: 68 }, playText: { color: '#0B0B0A', fontSize: 30, fontWeight: '900', marginLeft: 2 }, disabled: { opacity: 0.25 }, previewNote: { alignSelf: 'center', color: '#BDB6A4', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 }, message: { color: '#FFAAA8', lineHeight: 21, padding: 24 },
});

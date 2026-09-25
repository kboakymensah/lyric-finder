import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SavedSong, SongResult } from '../types/song';
import { SyncedLyrics } from './synced-lyrics';
import type { TimedLyricLine } from '../lib/synced-lyrics';

type PlaylistPreviewPlayerProps = {
  canNext: boolean;
  canPrevious: boolean;
  currentIndex: number;
  currentSong: SavedSong | SongResult | null;
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

export function PlaylistPreviewPlayer({
  canNext,
  canPrevious,
  currentIndex,
  currentSong,
  isPlaying,
  message,
  onNext,
  onPrevious,
  onSeekBack,
  onSeekForward,
  onToggle,
  queueLength,
  lyricLines = [], lyricLoading = false, lyricMessage = null, currentSeconds = 0,
}: PlaylistPreviewPlayerProps) {
  if (!currentSong && !message) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>PREVIEW PLAYER</Text>
      {currentSong && (
        <>
          <View style={styles.songRow}>
            {currentSong.artworkUrl ? <Image source={{ uri: currentSong.artworkUrl }} style={styles.artwork} /> : <View style={styles.artworkFallback}><Text style={styles.note}>♫</Text></View>}
            <View style={styles.songDetails}>
              <Text style={styles.title}>{currentSong.title}</Text>
              <Text style={styles.artist}>{currentSong.artist}</Text>
              <Text style={styles.position}>Song {currentIndex + 1} of {queueLength}</Text>
            </View>
          </View>
          <View style={styles.controls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous preview" disabled={!canPrevious} onPress={onPrevious} style={[styles.control, !canPrevious && styles.disabled]}><Text style={styles.controlText}>Previous</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Back 10 seconds" onPress={onSeekBack} style={styles.control}><Text style={styles.controlText}>↺ 10</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'} onPress={onToggle} style={[styles.control, styles.primaryControl]}><Text style={styles.primaryControlText}>{isPlaying ? 'Pause' : 'Play'}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Forward 10 seconds" onPress={onSeekForward} style={styles.control}><Text style={styles.controlText}>10 ↻</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next preview" disabled={!canNext} onPress={onNext} style={[styles.control, !canNext && styles.disabled]}><Text style={styles.controlText}>Next</Text></Pressable>
          </View>
          <SyncedLyrics lines={lyricLines} currentSeconds={currentSeconds} isLoading={lyricLoading} message={lyricMessage} />
        </>
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#25231C', borderColor: '#F7C948', borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 },
  kicker: { color: '#F7C948', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  songRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  artwork: { borderRadius: 10, height: 52, width: 52 },
  artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 10, height: 52, justifyContent: 'center', width: 52 },
  note: { color: '#0B0B0A', fontSize: 25, fontWeight: '800' },
  songDetails: { flex: 1, gap: 2 },
  title: { color: '#FFF7DF', fontSize: 16, fontWeight: '800' },
  artist: { color: '#D8CFB6' },
  position: { color: '#BDB6A4', fontSize: 13 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  control: { alignItems: 'center', borderColor: '#625B48', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  disabled: { opacity: 0.4 },
  controlText: { color: '#FFF7DF', fontSize: 12, fontWeight: '800' },
  primaryControl: { backgroundColor: '#F7C948', borderColor: '#F7C948' },
  primaryControlText: { color: '#0B0B0A', fontSize: 12, fontWeight: '800' },
  message: { color: '#FFAAA8', lineHeight: 21 },
});

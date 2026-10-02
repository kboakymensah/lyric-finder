import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import { PlaylistPreviewPlayer } from './playlist-preview-player';

export function PreviewPlayerSurface() {
  const [isOpen, setIsOpen] = useState(false);
  const player = usePreviewPlayer();
  const library = useLibrary();
  const song = player.currentSong;

  if (!song && !player.message) return null;

  return (
    <View pointerEvents="box-none" style={styles.surface}>
      {song && <View style={styles.miniPlayer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open now playing" onPress={() => setIsOpen(true)} style={styles.songButton}>
          {song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.artwork} /> : <View style={styles.artworkFallback}><Text style={styles.note}>♫</Text></View>}
          <View style={styles.details}><Text numberOfLines={1} style={styles.title}>{song.title}</Text><Text numberOfLines={1} style={styles.artist}>{song.artist}</Text></View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous preview" disabled={!player.canPrevious} onPress={player.previous} style={[styles.miniControl, !player.canPrevious && styles.disabled]}><Text style={styles.miniIcon}>⏮</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={player.isPlaying ? 'Pause preview' : 'Play preview'} onPress={player.toggle} style={styles.miniControl}><Text style={styles.miniIcon}>{player.isPlaying ? 'Ⅱ' : '▶'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Next preview" disabled={!player.canNext} onPress={player.next} style={[styles.miniControl, !player.canNext && styles.disabled]}><Text style={styles.miniIcon}>⏭</Text></Pressable>
      </View>}
      <PlaylistPreviewPlayer
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        canNext={player.canNext}
        canPrevious={player.canPrevious}
        currentIndex={player.currentIndex}
        currentSong={song}
        currentSeconds={player.currentSeconds}
        durationSeconds={player.durationSeconds}
        relatedSongs={player.relatedSongs}
        relatedLoading={player.relatedLoading}
        onPlayRelated={player.startSong}
        isFavorite={song ? library.isFavorite(song.id) : false}
        onToggleFavorite={library.toggleFavorite}
        isPlaying={player.isPlaying}
        lyricLines={player.lyricLines}
        lyricLoading={player.lyricLoading}
        lyricMessage={player.lyricMessage}
        message={player.message}
        onNext={player.next}
        onPrevious={player.previous}
        onSeekBack={() => player.seekBy(-10)}
        onSeekForward={() => player.seekBy(10)}
        onToggle={player.toggle}
        onChangePlaybackMode={player.cyclePlaybackMode}
        playbackMode={player.playbackMode}
        queueLength={player.queue.length || (song ? 1 : 0)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { bottom: 12, left: 12, position: 'absolute', right: 12 },
  miniPlayer: { alignItems: 'center', backgroundColor: '#25231C', borderColor: '#F7C948', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 9 },
  songButton: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  artwork: { borderRadius: 7, height: 42, width: 42 },
  artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 7, height: 42, justifyContent: 'center', width: 42 },
  note: { color: '#0B0B0A', fontSize: 20, fontWeight: '900' },
  details: { flex: 1 }, title: { color: '#FFF7DF', fontWeight: '800' }, artist: { color: '#D8CFB6', fontSize: 12, marginTop: 2 },
  miniControl: { alignItems: 'center', height: 38, justifyContent: 'center', width: 32 }, miniIcon: { color: '#F7C948', fontSize: 19, fontWeight: '800' }, disabled: { opacity: 0.3 },
});

import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SongResult } from '../types/song';

type SongResultCardProps = {
  song: SongResult;
  emphasis: 'best' | 'alternative';
  isPlaying: boolean;
  onTogglePreview: () => void;
};

export function SongResultCard({ song, emphasis, isPlaying, onTogglePreview }: SongResultCardProps) {
  const previewLabel = `${isPlaying ? 'Pause' : 'Preview'} ${song.title}`;

  return (
    <View style={[styles.card, emphasis === 'best' && styles.bestCard]}>
      {song.artworkUrl ? (
        <Image source={{ uri: song.artworkUrl }} style={styles.artwork} accessibilityLabel={`${song.title} artwork`} />
      ) : (
        <View style={styles.artworkFallback} accessibilityLabel={`${song.title} artwork unavailable`}>
          <Text style={styles.note}>♫</Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
        {song.lyricSnippet && <Text style={styles.snippet}>“{song.lyricSnippet}”</Text>}

        <View style={styles.actions}>
          {song.previewUrl && (
            <Pressable accessibilityRole="button" accessibilityLabel={previewLabel} onPress={onTogglePreview}>
              <Text style={styles.preview}>{isPlaying ? 'Pause' : 'Preview'}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Listen to ${song.title}`}
            onPress={() => void Linking.openURL(song.listenUrl)}>
            <Text style={styles.listen}>Listen</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181714',
    borderColor: '#3B372C',
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  bestCard: {
    borderColor: '#F7C948',
    borderWidth: 1,
  },
  artwork: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  artworkFallback: {
    alignItems: 'center',
    backgroundColor: '#F7C948',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  note: {
    color: '#0B0B0A',
    fontSize: 26,
    fontWeight: '800',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFF7DF',
    fontSize: 17,
    fontWeight: '800',
  },
  artist: {
    color: '#BDB6A4',
  },
  snippet: {
    color: '#D8CFB6',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  preview: {
    color: '#FFF7DF',
    fontWeight: '700',
  },
  listen: {
    color: '#F7C948',
    fontWeight: '800',
  },
});

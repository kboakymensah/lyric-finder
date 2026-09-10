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
    backgroundColor: '#171b2e',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  bestCard: {
    borderColor: '#a9f53f',
    borderWidth: 1,
  },
  artwork: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  artworkFallback: {
    alignItems: 'center',
    backgroundColor: '#a9f53f',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  note: {
    color: '#0d1020',
    fontSize: 26,
    fontWeight: '800',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  artist: {
    color: '#b2bad2',
  },
  snippet: {
    color: '#d3d9ef',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  preview: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listen: {
    color: '#a9f53f',
    fontWeight: '800',
  },
});

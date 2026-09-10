import { StyleSheet, Text, View } from 'react-native';

import { SongResultCard } from './song-result-card';
import type { SongResult } from '../types/song';

type SongResultsProps = {
  songs: SongResult[];
  hasSearched: boolean;
  isPlayingId: string | null;
  onTogglePreview: (song: SongResult) => void;
};

export function SongResults({ songs, hasSearched, isPlayingId, onTogglePreview }: SongResultsProps) {
  if (!hasSearched) {
    return null;
  }

  if (songs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No close lyric matches yet. Try another line from the chorus.</Text>
      </View>
    );
  }

  const [bestMatch, ...alternatives] = songs;

  return (
    <View style={styles.results}>
      <Text style={styles.heading}>Best match</Text>
      <SongResultCard
        song={bestMatch}
        emphasis="best"
        isPlaying={isPlayingId === bestMatch.id}
        onTogglePreview={() => onTogglePreview(bestMatch)}
      />

      {alternatives.length > 0 && (
        <View style={styles.alternatives}>
          <Text style={styles.heading}>More possible songs</Text>
          {alternatives.map((song) => (
            <SongResultCard
              key={song.id}
              song={song}
              emphasis="alternative"
              isPlaying={isPlayingId === song.id}
              onTogglePreview={() => onTogglePreview(song)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  results: {
    gap: 12,
  },
  alternatives: {
    gap: 12,
    marginTop: 12,
  },
  emptyState: {
    backgroundColor: '#181714',
    borderColor: '#3B372C',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: '#BDB6A4',
    fontSize: 16,
    lineHeight: 24,
  },
  heading: {
    color: '#BDB6A4',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import type { Playlist } from '../lib/library';
import { SongResultCard } from './song-result-card';
import type { SongResult } from '../types/song';

type SongResultsProps = {
  songs: SongResult[];
  hasSearched: boolean;
  isPlayingId: string | null;
  onTogglePreview: (song: SongResult) => void;
  isSaved?: (songId: string) => boolean;
  onViewLyrics?: (song: SongResult) => void;
  onListen?: (song: SongResult) => void;
  onToggleSaved?: (song: SongResult) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, song: SongResult) => void;
};

const noAction = () => {};
const isNotSaved = () => false;

export function SongResults({
  songs,
  hasSearched,
  isPlayingId,
  onTogglePreview,
  isSaved = isNotSaved,
  onViewLyrics = noAction,
  onListen = noAction,
  onToggleSaved = noAction,
  playlists = [],
  onAddToPlaylist = noAction,
}: SongResultsProps) {
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
        isSaved={isSaved(bestMatch.id)}
        onTogglePreview={() => onTogglePreview(bestMatch)}
        onViewLyrics={onViewLyrics}
        onListen={onListen}
        onToggleSaved={onToggleSaved}
        playlists={playlists}
        onAddToPlaylist={onAddToPlaylist}
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
              isSaved={isSaved(song.id)}
              onTogglePreview={() => onTogglePreview(song)}
              onViewLyrics={onViewLyrics}
              onListen={onListen}
              onToggleSaved={onToggleSaved}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
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

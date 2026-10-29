import { Pressable, StyleSheet, Text, View } from 'react-native';

import { artistsFromSongMatches } from '../lib/artist-discovery';
import type { Playlist } from '../lib/library';
import type { ListeningPlatform } from '../lib/listening-platforms';
import { SongResultCard } from './song-result-card';
import type { SongResult } from '../types/song';

type SongResultsProps = {
  songs: SongResult[];
  hasSearched: boolean;
  isPlayingId: string | null;
  onTogglePreview: (song: SongResult) => void;
  isSaved?: (songId: string) => boolean;
  isFavorite?: (songId: string) => boolean;
  onViewLyrics?: (song: SongResult) => void;
  onListen?: (song: SongResult, platform: ListeningPlatform) => void;
  onToggleSaved?: (song: SongResult) => void;
  onToggleFavorite?: (song: SongResult) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, song: SongResult) => void;
  onOpenDetails?: (song: SongResult) => void;
  onOpenArtist?: (artist: string) => void;
};

const noAction = () => {};
const isNotSaved = () => false;

export function SongResults({
  songs,
  hasSearched,
  isPlayingId,
  onTogglePreview,
  isSaved = isNotSaved,
  isFavorite = isNotSaved,
  onViewLyrics = noAction,
  onListen = noAction,
  onToggleSaved = noAction,
  onToggleFavorite = noAction,
  playlists = [],
  onAddToPlaylist = noAction,
  onOpenDetails = noAction,
  onOpenArtist = noAction,
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
  const artists = artistsFromSongMatches(songs);

  return (
    <View style={styles.results}>
      <Text style={styles.heading}>Best match</Text>
      <SongResultCard
        song={bestMatch}
        emphasis="best"
        isPlaying={isPlayingId === bestMatch.id}
        isSaved={isSaved(bestMatch.id)}
        isFavorite={isFavorite(bestMatch.id)}
        onTogglePreview={() => onTogglePreview(bestMatch)}
        onViewLyrics={onViewLyrics}
        onListen={onListen}
        onToggleSaved={onToggleSaved}
        onToggleFavorite={onToggleFavorite}
        playlists={playlists}
        onAddToPlaylist={onAddToPlaylist}
        onOpenDetails={onOpenDetails}
      />

      {artists.length > 0 && <View style={styles.artistSection}>
        <Text style={styles.heading}>Artists in these matches</Text>
        <Text style={styles.artistHelper}>Explore the artists from your real lyric matches.</Text>
        <View style={styles.artistList}>
          {artists.map((artist) => <Pressable accessibilityRole="button" accessibilityLabel={`Explore ${artist}`} key={artist} onPress={() => onOpenArtist(artist)} style={styles.artistChip}>
            <Text numberOfLines={1} style={styles.artistChipText}>{artist}</Text>
            <Text style={styles.artistArrow}>›</Text>
          </Pressable>)}
        </View>
      </View>}

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
              isFavorite={isFavorite(song.id)}
              onTogglePreview={() => onTogglePreview(song)}
              onViewLyrics={onViewLyrics}
              onListen={onListen}
              onToggleSaved={onToggleSaved}
              onToggleFavorite={onToggleFavorite}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
              onOpenDetails={onOpenDetails}
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
  artistSection: { gap: 8, marginTop: 4 },
  artistHelper: { color: '#AAA69C', fontSize: 13, lineHeight: 19 },
  artistList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  artistChip: { alignItems: 'center', backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 7, maxWidth: '100%', paddingHorizontal: 13, paddingVertical: 10 },
  artistChipText: { color: '#FFF7DF', fontSize: 14, fontWeight: '800', maxWidth: 210 },
  artistArrow: { color: '#F7C948', fontSize: 21, fontWeight: '700', lineHeight: 18 },
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

import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Playlist } from '../lib/library';
import type { ListeningPlatform } from '../lib/listening-platforms';
import type { SongResult } from '../types/song';

type SongResultCardProps = {
  song: SongResult;
  emphasis: 'best' | 'alternative';
  isPlaying: boolean;
  isSaved: boolean;
  onTogglePreview: () => void;
  onViewLyrics: (song: SongResult) => void;
  onListen: (song: SongResult, platform: ListeningPlatform) => void;
  onToggleSaved: (song: SongResult) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, song: SongResult) => void;
};

export function SongResultCard({
  song,
  emphasis,
  isPlaying,
  isSaved,
  onTogglePreview,
  onViewLyrics,
  onListen,
  onToggleSaved,
  playlists = [],
  onAddToPlaylist = () => {},
}: SongResultCardProps) {
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showListeningPicker, setShowListeningPicker] = useState(false);
  const [playlistAdded, setPlaylistAdded] = useState(false);
  const playlistHighlight = useRef(new Animated.Value(0)).current;
  const previewLabel = `${isPlaying ? 'Pause' : 'Play 30-second preview of'} ${song.title}`;

  useEffect(() => {
    Animated.timing(playlistHighlight, {
      toValue: playlistAdded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();

    if (!playlistAdded) {
      return;
    }

    const resetTimer = setTimeout(() => setPlaylistAdded(false), 1500);
    return () => clearTimeout(resetTimer);
  }, [playlistAdded, playlistHighlight]);

  const playlistBarColor = playlistHighlight.interpolate({
    inputRange: [0, 1],
    outputRange: ['#25231C', '#2F9E44'],
  });

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
        <View style={styles.songHeader}>
          <Text style={styles.title}>{song.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Remove ${song.title} from liked songs` : `Add ${song.title} to liked songs`}
            onPress={() => onToggleSaved(song)}
            style={[styles.saveButton, isSaved && styles.savedButton]}>
            <Text style={styles.saveSymbol}>{isSaved ? '✓' : '+'}</Text>
          </Pressable>
        </View>
        <Text style={styles.artist}>{song.artist}</Text>
        {song.lyricSnippet && <Text style={styles.snippet}>“{song.lyricSnippet}”</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View lyrics for ${song.title}`}
            onPress={() => onViewLyrics(song)}
            style={[styles.actionBar, styles.lyricsBar]}>
            <Text style={styles.actionText}>View Lyrics</Text>
          </Pressable>
          {song.previewUrl ? (
            <Pressable accessibilityRole="button" accessibilityLabel={previewLabel} onPress={onTogglePreview} style={[styles.actionBar, styles.previewBar]}>
              <Text style={styles.actionText}>{isPlaying ? 'Pause Preview' : 'Play 30-second Preview'}</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Preview unavailable for ${song.title}`}
              disabled
              style={[styles.actionBar, styles.previewBar, styles.previewUnavailable]}>
              <Text style={[styles.actionText, styles.previewUnavailableText]}>Preview unavailable</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose where to listen to ${song.title}`}
            onPress={() => setShowListeningPicker((isOpen) => !isOpen)}
            style={[styles.actionBar, styles.listenBar]}>
            <Text style={[styles.actionText, styles.listenText]}>Listen on…</Text>
          </Pressable>
          {showListeningPicker && (
            <View style={styles.listeningPicker}>
              <Text style={styles.pickerHint}>Choose a music service</Text>
              {([
                ['appleMusic', 'Apple Music'],
                ['spotify', 'Spotify'],
                ['soundcloud', 'SoundCloud'],
                ['webSearch', 'Search the web'],
              ] as const).map(([platform, label]) => (
                <Pressable
                  key={platform}
                  accessibilityRole="button"
                  accessibilityLabel={`Listen to ${song.title} on ${label}`}
                  onPress={() => {
                    setShowListeningPicker(false);
                    onListen(song, platform);
                  }}
                  style={styles.listeningChoice}>
                  <Text style={styles.listeningChoiceText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Animated.View style={[styles.actionBar, styles.playlistBar, { backgroundColor: playlistBarColor }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playlistAdded ? `Added ${song.title} to a playlist` : `Add ${song.title} to a playlist`}
              onPress={() => setShowPlaylistPicker((isOpen) => !isOpen)}
              style={styles.playlistPressable}>
              <Text style={styles.actionText}>{playlistAdded ? 'Added to Playlist ✓' : 'Add to Playlist'}</Text>
            </Pressable>
          </Animated.View>
          {showPlaylistPicker && (
            <View style={styles.playlistPicker}>
              {playlists.length === 0 ? (
                <Text style={styles.pickerHint}>Create a playlist in My Library first.</Text>
              ) : (
                playlists.map((playlist) => (
                  <Pressable
                    key={playlist.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${song.title} to ${playlist.name}`}
                    onPress={() => {
                      onAddToPlaylist(playlist.id, song);
                      setShowPlaylistPicker(false);
                      setPlaylistAdded(true);
                    }}
                    style={styles.playlistChoice}>
                    <Text style={styles.playlistChoiceText}>{playlist.name}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}
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
  songHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
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
    gap: 8,
    marginTop: 8,
  },
  actionBar: {
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  lyricsBar: {
    backgroundColor: '#302B1B',
  },
  previewBar: {
    backgroundColor: '#F7C948',
  },
  previewUnavailable: {
    backgroundColor: '#302B1B',
    borderColor: '#5E5744',
    borderWidth: 1,
  },
  previewUnavailableText: {
    color: '#BDB6A4',
  },
  listenBar: {
    borderColor: '#F7C948',
    borderWidth: 1,
  },
  playlistBar: {
    overflow: 'hidden',
  },
  playlistPressable: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  actionText: {
    color: '#FFF7DF',
    fontWeight: '700',
  },
  listenText: {
    color: '#F7C948',
  },
  listeningPicker: {
    backgroundColor: '#0B0B0A',
    borderColor: '#F7C948',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 8,
  },
  listeningChoice: {
    backgroundColor: '#302B1B',
    borderRadius: 8,
    padding: 10,
  },
  listeningChoiceText: {
    color: '#FFF7DF',
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#F7C948',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  savedButton: {
    backgroundColor: '#FFF7DF',
  },
  saveSymbol: {
    color: '#0B0B0A',
    fontWeight: '800',
    fontSize: 21,
  },
  playlistPicker: {
    backgroundColor: '#0B0B0A',
    borderColor: '#3B372C',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 8,
  },
  pickerHint: {
    color: '#BDB6A4',
    fontSize: 12,
    lineHeight: 18,
  },
  playlistChoice: {
    backgroundColor: '#302B1B',
    borderRadius: 8,
    padding: 10,
  },
  playlistChoiceText: {
    color: '#FFF7DF',
    fontWeight: '700',
  },
});

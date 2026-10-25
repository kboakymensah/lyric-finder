import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import { useSongDetails } from '../contexts/song-details-context';
import { lyricDetailStatus } from '../lib/song-details';
import { screenContentBottomInset } from '../components/music-ui';
import type { SongResult } from '../types/song';

export default function SongScreen() {
  const { song, clearSong } = useSongDetails();
  const library = useLibrary();
  const player = usePreviewPlayer();

  if (!song) return <SafeAreaView style={styles.screen}><View style={styles.unavailable}><Text style={styles.unavailableTitle}>Song unavailable</Text><Text style={styles.unavailableMessage}>Return to search and choose a real song result to view its details.</Text><Pressable accessibilityRole="button" accessibilityLabel="Return to Search" onPress={() => router.replace('/')} style={styles.goldButton}><Text style={styles.goldText}>Return to Search</Text></Pressable></View></SafeAreaView>;

  const result: SongResult = { ...song, lyricSnippet: 'lyricSnippet' in song ? song.lyricSnippet : null, matchScore: 'matchScore' in song ? song.matchScore : 0 };
  const lyricStatus = lyricDetailStatus(result.lyricSnippet);
  const goBack = () => { clearSong(); router.back(); };
  const openLyrics = () => { if (song.lyricsUrl) void Linking.openURL(song.lyricsUrl); };

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack}><Text style={styles.back}>‹  Back</Text></Pressable>
    <View style={styles.hero}>{song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.artwork} accessibilityLabel={`${song.title} artwork`} /> : <View style={[styles.artwork, styles.artworkFallback]}><Text style={styles.note}>♫</Text></View>}<View style={styles.copy}><Text style={styles.eyebrow}>SONG DETAILS</Text><Text style={styles.title}>{song.title}</Text><Text style={styles.artist}>{song.artist}</Text></View></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Toggle Favorite" onPress={() => library.toggleFavorite(result)} style={styles.outlineAction}><Text style={styles.actionText}>{library.isFavorite(song.id) ? '♥  Favorited' : '♡  Favorite'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Toggle Saved" onPress={() => library.toggleSong(result)} style={[styles.outlineAction, library.isLiked(song.id) && styles.selectedAction]}><Text style={styles.actionText}>{library.isLiked(song.id) ? '✓  Saved' : '+  Save'}</Text></Pressable></View>
    <View style={styles.playlistPanel}><Text style={styles.sectionTitle}>Add to playlist</Text>{library.data.playlists.length === 0 ? <Text style={styles.muted}>Create a playlist from the Playlists tab first.</Text> : library.data.playlists.map((playlist) => <Pressable key={playlist.id} accessibilityRole="button" accessibilityLabel={`Add to ${playlist.name}`} onPress={() => library.addToPlaylist(playlist.id, result)}><Text style={styles.playlistName}>+  {playlist.name}</Text></Pressable>)}</View>
    <View style={styles.lyricsPanel}><View style={styles.lyricsHeader}><Text style={styles.sectionTitle}>Lyrics</Text><Text style={styles.status}>{lyricStatus.label}</Text></View>{result.lyricSnippet ? <Text style={styles.lyrics}>{result.lyricSnippet}</Text> : <Text style={styles.muted}>No lyric text was supplied for this result. You can still try the source page.</Text>}{song.lyricsUrl ? <Pressable accessibilityRole="button" accessibilityLabel="Open lyrics source" onPress={openLyrics}><Text style={styles.source}>Open lyrics source  ›</Text></Pressable> : null}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={song.previewUrl ? 'Play 30-second preview' : 'Preview unavailable'} disabled={!song.previewUrl} onPress={() => player.startSong(result)} style={[styles.goldButton, !song.previewUrl && styles.disabled]}><Text style={styles.goldText}>{song.previewUrl ? '▶  Play 30-second preview' : 'Preview unavailable'}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#050505', flex: 1 }, content: { gap: 18, padding: 20, paddingBottom: screenContentBottomInset }, back: { color: '#F7C948', fontSize: 16, fontWeight: '800' }, hero: { alignItems: 'center', flexDirection: 'row', gap: 16, marginTop: 10 }, artwork: { backgroundColor: '#1D1C18', borderRadius: 16, height: 112, width: 112 }, artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', justifyContent: 'center' }, note: { color: '#14120C', fontSize: 44, fontWeight: '900' }, copy: { flex: 1, gap: 5 }, eyebrow: { color: '#F7C948', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 }, title: { color: '#FFFDF7', fontSize: 28, fontWeight: '900', letterSpacing: -1 }, artist: { color: '#AAA69C', fontSize: 16 }, actions: { flexDirection: 'row', gap: 10 }, outlineAction: { alignItems: 'center', backgroundColor: '#161613', borderColor: '#343124', borderRadius: 14, borderWidth: 1, flex: 1, padding: 14 }, selectedAction: { borderColor: '#F7C948' }, actionText: { color: '#FFFDF7', fontSize: 13, fontWeight: '800' }, playlistPanel: { backgroundColor: '#161613', borderColor: '#343124', borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 }, sectionTitle: { color: '#FFFDF7', fontSize: 20, fontWeight: '900' }, playlistName: { color: '#F7C948', fontWeight: '800', paddingVertical: 5 }, lyricsPanel: { gap: 14 }, lyricsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, status: { backgroundColor: '#302B1B', borderRadius: 8, color: '#F7C948', fontSize: 10, fontWeight: '900', padding: 7, textTransform: 'uppercase' }, lyrics: { color: '#E0DDD4', fontSize: 18, fontWeight: '700', lineHeight: 28 }, muted: { color: '#AAA69C', lineHeight: 20 }, source: { color: '#F7C948', fontWeight: '800' }, goldButton: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 999, justifyContent: 'center', minHeight: 54, padding: 14 }, goldText: { color: '#14120C', fontWeight: '900' }, disabled: { opacity: 0.45 }, unavailable: { flex: 1, gap: 14, justifyContent: 'center', padding: 24 }, unavailableTitle: { color: '#FFFDF7', fontSize: 28, fontWeight: '900' }, unavailableMessage: { color: '#AAA69C', fontSize: 16, lineHeight: 24 },
});

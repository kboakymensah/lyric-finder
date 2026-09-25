import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../contexts/library-context';
import { PlaylistPreviewPlayer } from '../components/playlist-preview-player';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import type { SavedSong } from '../types/song';

const toToggleableSong = (song: SavedSong) => ({ ...song, lyricSnippet: null, matchScore: 0 });

export default function LibraryScreen() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { addToPlaylist, create, data, error, removeFromPlaylist, removePlaylist, status, toggleSong } = useLibrary();
  const previewPlayer = usePreviewPlayer();
  const selectedPlaylist = data.playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const selectedSongs = selectedPlaylist?.songs ?? [];

  function createPlaylist() {
    const name = newPlaylistName.trim();
    if (!name || data.playlists.some((playlist) => playlist.name.toLowerCase() === name.toLowerCase())) return;
    create(name);
    setNewPlaylistName('');
  }

  function deleteSelectedPlaylist() {
    if (!selectedPlaylist) return;
    removePlaylist(selectedPlaylist.id);
    setSelectedPlaylistId(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Link href="/" style={styles.backLink}>← Back to search</Link>
        <View style={styles.hero}>
          <Text style={styles.kicker}>YOUR COLLECTION</Text>
          <Text style={styles.title}>My Library</Text>
          <Text style={styles.subtitle}>Save songs you love and arrange them into playlists.</Text>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.section}>
          <View style={styles.selectionHeader}>
            <Text style={styles.heading}>Liked songs</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Play liked previews" onPress={() => previewPlayer.startQueue(data.likedSongs)} style={styles.playButton}><Text style={styles.playButtonText}>Play all</Text></Pressable>
          </View>
          {status === 'loading' ? <Text style={styles.muted}>Loading your library…</Text> : data.likedSongs.length === 0 ? (
            <Text style={styles.empty}>Save a song from your search results to start your library.</Text>
          ) : data.likedSongs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              {song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.artwork} /> : <View style={styles.artworkFallback}><Text style={styles.note}>♫</Text></View>}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle}>{song.title}</Text><Text style={styles.artist}>{song.artist}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from liked songs`} onPress={() => toggleSong(toToggleableSong(song))}><Text style={styles.remove}>Remove</Text></Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Playlists</Text>
          <View style={styles.createRow}>
            <TextInput accessibilityLabel="New playlist name" onChangeText={setNewPlaylistName} placeholder="New playlist name" placeholderTextColor="#BDB6A4" style={styles.input} value={newPlaylistName} />
            <Pressable accessibilityRole="button" onPress={createPlaylist} style={styles.createButton}><Text style={styles.createText}>Create playlist</Text></Pressable>
          </View>
          {data.playlists.length === 0 ? <Text style={styles.muted}>Create a playlist to organize songs from your search results.</Text> : <View style={styles.playlistChoices}>{data.playlists.map((playlist) => (
            <Pressable key={playlist.id} accessibilityRole="button" onPress={() => setSelectedPlaylistId(playlist.id)} style={[styles.playlistChoice, selectedPlaylistId === playlist.id && styles.selectedPlaylistChoice]}>
              <Text style={[styles.playlistName, selectedPlaylistId === playlist.id && styles.selectedPlaylistName]}>{playlist.name}</Text>
              <Text style={[styles.count, selectedPlaylistId === playlist.id && styles.selectedCount]}>{playlist.songs.length} song{playlist.songs.length === 1 ? '' : 's'}</Text>
            </Pressable>
          ))}</View>}
        </View>

        {selectedPlaylist && <View style={styles.section}>
          <View style={styles.selectionHeader}><Text style={styles.heading}>{selectedPlaylist.name}</Text><View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel={`Play ${selectedPlaylist.name} previews`} onPress={() => previewPlayer.startQueue(selectedPlaylist.songs)} style={styles.playButton}><Text style={styles.playButtonText}>Play all</Text></Pressable><Pressable accessibilityRole="button" onPress={deleteSelectedPlaylist}><Text style={styles.delete}>Delete playlist</Text></Pressable></View></View>
          {data.likedSongs.filter((song) => !selectedPlaylist.songs.some((playlistSong) => playlistSong.id === song.id)).map((song) => (
            <View key={song.id} style={styles.membershipRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add ${song.title} to ${selectedPlaylist.name}`} onPress={() => addToPlaylist(selectedPlaylist.id, toToggleableSong(song))}><Text style={styles.add}>Add</Text></Pressable></View>
          ))}
          {selectedSongs.length === 0 ? <Text style={styles.muted}>No songs in this playlist yet.</Text> : selectedSongs.map((song) => (
            <View key={song.id} style={styles.membershipRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from ${selectedPlaylist.name}`} onPress={() => removeFromPlaylist(selectedPlaylist.id, song.id)}><Text style={styles.remove}>Remove</Text></Pressable></View>
          ))}
        </View>}

        <PlaylistPreviewPlayer
          canNext={previewPlayer.canNext}
          canPrevious={previewPlayer.canPrevious}
          currentIndex={previewPlayer.currentIndex}
          currentSong={previewPlayer.currentSong}
          isPlaying={previewPlayer.isPlaying}
          message={previewPlayer.message}
          onNext={previewPlayer.next}
          onPrevious={previewPlayer.previous}
          onSeekBack={() => previewPlayer.seekBy(-10)}
          onSeekForward={() => previewPlayer.seekBy(10)}
          onToggle={previewPlayer.toggle}
          queueLength={previewPlayer.queue.length}
          lyricLines={previewPlayer.lyricLines}
          lyricLoading={previewPlayer.lyricLoading}
          lyricMessage={previewPlayer.lyricMessage}
          currentSeconds={previewPlayer.currentSeconds}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' }, content: { gap: 18, padding: 24, paddingBottom: 48 }, backLink: { color: '#F7C948', fontWeight: '800', marginTop: 8 }, hero: { gap: 7, marginTop: 8 }, kicker: { color: '#F7C948', fontWeight: '800', letterSpacing: 2 }, title: { color: '#FFF7DF', fontSize: 36, fontWeight: '800' }, subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 24 }, section: { backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 }, heading: { color: '#FFF7DF', fontSize: 20, fontWeight: '800' }, muted: { color: '#BDB6A4', lineHeight: 22 }, empty: { color: '#D8CFB6', lineHeight: 22 }, error: { color: '#FFAAA8' }, songCard: { flexDirection: 'row', gap: 12 }, artwork: { borderRadius: 10, height: 56, width: 56 }, artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 10, height: 56, justifyContent: 'center', width: 56 }, note: { color: '#0B0B0A', fontSize: 26, fontWeight: '800' }, songDetails: { flex: 1, gap: 3 }, songTitle: { color: '#FFF7DF', fontSize: 17, fontWeight: '800' }, artist: { color: '#BDB6A4' }, remove: { color: '#FFAAA8', fontWeight: '800', marginTop: 4 }, createRow: { gap: 10 }, input: { backgroundColor: '#0B0B0A', borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, color: '#FFF7DF', padding: 13 }, createButton: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 12, padding: 13 }, createText: { color: '#0B0B0A', fontWeight: '800' }, playlistChoices: { gap: 8 }, playlistChoice: { borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 13 }, selectedPlaylistChoice: { backgroundColor: '#F7C948', borderColor: '#F7C948' }, playlistName: { color: '#FFF7DF', fontWeight: '800' }, selectedPlaylistName: { color: '#0B0B0A' }, count: { color: '#BDB6A4' }, selectedCount: { color: '#42370A' }, selectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, headerActions: { alignItems: 'center', flexDirection: 'row', gap: 12 }, playButton: { backgroundColor: '#F7C948', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 }, playButtonText: { color: '#0B0B0A', fontSize: 12, fontWeight: '800' }, delete: { color: '#FFAAA8', fontWeight: '800' }, membershipRow: { alignItems: 'center', borderTopColor: '#3B372C', borderTopWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingTop: 12 }, membershipTitle: { color: '#D8CFB6', flex: 1 }, add: { color: '#F7C948', fontWeight: '800' },
});

import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import type { SavedSong } from '../types/song';

const toToggleableSong = (song: SavedSong) => ({ ...song, lyricSnippet: null, matchScore: 0 });

export default function LibraryScreen() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistRename, setPlaylistRename] = useState('');
  const { addToPlaylist, create, data, error, isFavorite, removeFromPlaylist, removePlaylist, renamePlaylist, status, toggleFavorite, toggleSong } = useLibrary();
  const previewPlayer = usePreviewPlayer();
  const selectedPlaylist = data.playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const selectedSongs = selectedPlaylist?.songs ?? [];
  const favoriteSongs = data.likedSongs.filter((song) => data.favoriteSongIds.includes(song.id));
  function playSongs(songs: SavedSong[], mode: 'repeat-all' | 'shuffle' = 'repeat-all', source?: 'liked' | 'favorites') {
    previewPlayer.setPlaybackMode(mode);
    if (source) previewPlayer.startLibraryQueue(songs, source);
    else previewPlayer.startQueue(songs);
  }

  useEffect(() => {
    if (previewPlayer.libraryQueueSource === 'liked') previewPlayer.refreshLibraryQueue(data.likedSongs);
    if (previewPlayer.libraryQueueSource === 'favorites') previewPlayer.refreshLibraryQueue(favoriteSongs);
  }, [data.likedSongs, favoriteSongs, previewPlayer]);

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
  function renameSelectedPlaylist() {
    if (!selectedPlaylist) return;
    renamePlaylist(selectedPlaylist.id, playlistRename);
    setPlaylistRename('');
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
            <View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Shuffle liked previews" onPress={() => playSongs(data.likedSongs, 'shuffle', 'liked')} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Shuffle</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Play liked previews" onPress={() => playSongs(data.likedSongs, 'repeat-all', 'liked')} style={styles.playButton}><Text style={styles.playButtonText}>Play all</Text></Pressable></View>
          </View>
          {status === 'loading' ? <Text style={styles.muted}>Loading your library…</Text> : data.likedSongs.length === 0 ? (
            <Text style={styles.empty}>Save a song from your search results to start your library.</Text>
          ) : data.likedSongs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              {song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.artwork} /> : <View style={styles.artworkFallback}><Text style={styles.note}>♫</Text></View>}
              <View style={styles.songDetails}>
                <Text style={styles.songTitle}>{song.title}</Text><Text style={styles.artist}>{song.artist}</Text>
                <View style={styles.libraryActions}><Pressable accessibilityRole="button" accessibilityLabel={isFavorite(song.id) ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`} onPress={() => toggleFavorite(toToggleableSong(song))}><Text style={styles.favorite}>{isFavorite(song.id) ? '★ Favorite' : '☆ Favorite'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from liked songs`} onPress={() => toggleSong(toToggleableSong(song))}><Text style={styles.remove}>Remove</Text></Pressable></View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.selectionHeader}><Text style={styles.heading}>Favorites</Text><View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Shuffle favorite previews" onPress={() => playSongs(favoriteSongs, 'shuffle', 'favorites')} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Shuffle</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Play favorite previews" onPress={() => playSongs(favoriteSongs, 'repeat-all', 'favorites')} style={styles.playButton}><Text style={styles.playButtonText}>Play all</Text></Pressable></View></View>
          {favoriteSongs.length === 0 ? <Text style={styles.empty}>Tap the star on a liked song to add it to Favorites.</Text> : favoriteSongs.map((song) => <View key={song.id} style={styles.membershipRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from favorites`} onPress={() => toggleFavorite(toToggleableSong(song))}><Text style={styles.favorite}>★</Text></Pressable></View>)}
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
          <View style={styles.renameRow}><TextInput accessibilityLabel={`Rename ${selectedPlaylist.name}`} onChangeText={setPlaylistRename} placeholder="Rename playlist" placeholderTextColor="#BDB6A4" style={styles.renameInput} value={playlistRename} /><Pressable accessibilityRole="button" accessibilityLabel={`Rename ${selectedPlaylist.name}`} onPress={renameSelectedPlaylist} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Rename</Text></Pressable></View>
          {data.likedSongs.filter((song) => !selectedPlaylist.songs.some((playlistSong) => playlistSong.id === song.id)).map((song) => (
            <View key={song.id} style={styles.membershipRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add ${song.title} to ${selectedPlaylist.name}`} onPress={() => addToPlaylist(selectedPlaylist.id, toToggleableSong(song))}><Text style={styles.add}>Add</Text></Pressable></View>
          ))}
          {selectedSongs.length === 0 ? <Text style={styles.muted}>No songs in this playlist yet.</Text> : selectedSongs.map((song) => (
            <View key={song.id} style={styles.membershipRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from ${selectedPlaylist.name}`} onPress={() => removeFromPlaylist(selectedPlaylist.id, song.id)}><Text style={styles.remove}>Remove</Text></Pressable></View>
          ))}
        </View>}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' }, content: { gap: 18, padding: 24, paddingBottom: 48 }, backLink: { color: '#F7C948', fontWeight: '800', marginTop: 8 }, hero: { gap: 7, marginTop: 8 }, kicker: { color: '#F7C948', fontWeight: '800', letterSpacing: 2 }, title: { color: '#FFF7DF', fontSize: 36, fontWeight: '800' }, subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 24 }, section: { backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 }, heading: { color: '#FFF7DF', fontSize: 20, fontWeight: '800' }, muted: { color: '#BDB6A4', lineHeight: 22 }, empty: { color: '#D8CFB6', lineHeight: 22 }, error: { color: '#FFAAA8' }, songCard: { flexDirection: 'row', gap: 12 }, artwork: { borderRadius: 10, height: 56, width: 56 }, artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 10, height: 56, justifyContent: 'center', width: 56 }, note: { color: '#0B0B0A', fontSize: 26, fontWeight: '800' }, songDetails: { flex: 1, gap: 3 }, songTitle: { color: '#FFF7DF', fontSize: 17, fontWeight: '800' }, artist: { color: '#BDB6A4' }, libraryActions: { flexDirection: 'row', gap: 14, marginTop: 4 }, remove: { color: '#FFAAA8', fontWeight: '800', marginTop: 4 }, favorite: { color: '#F7C948', fontWeight: '900', marginTop: 4 }, createRow: { gap: 10 }, input: { backgroundColor: '#0B0B0A', borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, color: '#FFF7DF', padding: 13 }, createButton: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 12, padding: 13 }, createText: { color: '#0B0B0A', fontWeight: '800' }, playlistChoices: { gap: 8 }, playlistChoice: { borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 13 }, selectedPlaylistChoice: { backgroundColor: '#F7C948', borderColor: '#F7C948' }, playlistName: { color: '#FFF7DF', fontWeight: '800' }, selectedPlaylistName: { color: '#0B0B0A' }, count: { color: '#BDB6A4' }, selectedCount: { color: '#42370A' }, selectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 }, playButton: { backgroundColor: '#F7C948', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 }, playButtonText: { color: '#0B0B0A', fontSize: 12, fontWeight: '800' }, outlineButton: { borderColor: '#F7C948', borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 }, outlineButtonText: { color: '#F7C948', fontSize: 12, fontWeight: '800' }, delete: { color: '#FFAAA8', fontWeight: '800' }, membershipRow: { alignItems: 'center', borderTopColor: '#3B372C', borderTopWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingTop: 12 }, membershipTitle: { color: '#D8CFB6', flex: 1 }, add: { color: '#F7C948', fontWeight: '800' }, renameRow: { alignItems: 'center', flexDirection: 'row', gap: 8 }, renameInput: { backgroundColor: '#0B0B0A', borderColor: '#3B372C', borderRadius: 9, borderWidth: 1, color: '#FFF7DF', flex: 1, padding: 10 },
});

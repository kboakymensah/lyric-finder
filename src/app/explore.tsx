import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import type { SavedSong } from '../types/song';

type LibraryView = 'home' | 'liked' | 'favorites' | 'playlists' | 'playlist';

export const libraryCollectionDefinitions = [
  { id: 'liked' as const, title: 'Liked Songs', subtitle: 'Every song you saved from a lyric search.', emptyMessage: 'Save a song from your search results to start your library.' },
  { id: 'favorites' as const, title: 'Favorites', subtitle: 'The songs you marked with a star.', emptyMessage: 'Tap the star on a liked song to add it to Favorites.' },
  { id: 'playlists' as const, title: 'Playlists', subtitle: 'Collections you made from your finds.', emptyMessage: 'Create a playlist to organize songs from your search results.' },
] as const;

const toToggleableSong = (song: SavedSong) => ({ ...song, lyricSnippet: null, matchScore: 0 });

function SongRow({ song, favorite, onFavorite, onPlay, trailing }: { song: SavedSong; favorite?: boolean; onFavorite?: () => void; onPlay: () => void; trailing?: ReactNode }) {
  return <View style={styles.songRow}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Play ${song.title}`} onPress={onPlay} style={styles.songPress}>
      {song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.artwork} /> : <View style={[styles.artwork, styles.artworkFallback]}><Text style={styles.note}>♫</Text></View>}
      <View style={styles.songDetails}><Text numberOfLines={1} style={styles.songTitle}>{song.title}</Text><Text numberOfLines={1} style={styles.artist}>{song.artist}</Text></View>
    </Pressable>
    {onFavorite && <Pressable accessibilityRole="button" accessibilityLabel={favorite ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`} onPress={onFavorite} style={styles.iconAction}><Text style={[styles.favorite, favorite && styles.favoriteFilled]}>{favorite ? '♥' : '♡'}</Text></Pressable>}
    {trailing}
  </View>;
}

export function LibraryScreen({ initialView = 'home' }: { initialView?: LibraryView }) {
  const [view, setView] = useState<LibraryView>(initialView);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistRename, setPlaylistRename] = useState('');
  const { addToPlaylist, create, data, error, isFavorite, removeFromPlaylist, removePlaylist, renamePlaylist, status, toggleFavorite } = useLibrary();
  const player = usePreviewPlayer();
  const favorites = data.likedSongs.filter((song) => data.favoriteSongIds.includes(song.id));
  const playlist = data.playlists.find((item) => item.id === selectedPlaylistId) ?? null;

  useEffect(() => {
    if (player.libraryQueueSource === 'liked') player.refreshLibraryQueue(data.likedSongs);
    if (player.libraryQueueSource === 'favorites') player.refreshLibraryQueue(favorites);
  }, [data.likedSongs, favorites, player]);

  function play(songs: SavedSong[], mode: 'repeat-all' | 'shuffle', source?: 'liked' | 'favorites') {
    player.setPlaybackMode(mode);
    if (source) player.startLibraryQueue(songs, source); else player.startQueue(songs);
  }
  function createPlaylist() {
    const name = newPlaylistName.trim();
    if (!name || data.playlists.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    create(name); setNewPlaylistName('');
  }
  function backToLibrary() { setSelectedPlaylistId(null); setView('home'); }
  const title = view === 'liked' ? 'Liked Songs' : view === 'favorites' ? 'Favorites' : view === 'playlists' ? 'Playlists' : view === 'playlist' ? playlist?.name ?? 'Playlist' : 'My Library';
  const kicker = view === 'liked' ? 'YOUR SAVED FINDS' : view === 'favorites' ? 'SONGS YOU LOVE' : view === 'playlists' ? 'MADE FOR YOUR FINDS' : view === 'playlist' ? 'YOUR PLAYLIST' : 'YOUR COLLECTION';

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.topRow}>{view === 'home' ? <Link href="/" style={styles.backLink}>← Search</Link> : <Pressable accessibilityRole="button" accessibilityLabel="Back to My Library" onPress={backToLibrary}><Text style={styles.backLink}>← My Library</Text></Pressable>}<Text style={styles.countBadge}>{data.likedSongs.length}</Text></View>
    <View style={styles.hero}><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text>{view === 'home' && <Text style={styles.subtitle}>Your saved songs, favorites, and playlists in one place.</Text>}</View>
    {error && <Text style={styles.error}>{error}</Text>}

    {view === 'home' && <>
      {player.recentlyPlayed.length > 0 && <View style={styles.section}><Text style={styles.heading}>Recently played</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentStrip}>{player.recentlyPlayed.slice(0, 6).map((song) => <Pressable key={song.id} accessibilityRole="button" accessibilityLabel={`Play ${song.title} again`} onPress={() => player.startSong(toToggleableSong(song))} style={styles.recentCard}>{song.artworkUrl ? <Image source={{ uri: song.artworkUrl }} style={styles.recentArtwork} /> : <View style={[styles.recentArtwork, styles.artworkFallback]}><Text style={styles.note}>♫</Text></View>}<Text numberOfLines={1} style={styles.recentTitle}>{song.title}</Text><Text numberOfLines={1} style={styles.recentArtist}>{song.artist}</Text></Pressable>)}</ScrollView></View>}
      <View style={styles.collectionList}>{libraryCollectionDefinitions.map((collection) => { const count = collection.id === 'liked' ? data.likedSongs.length : collection.id === 'favorites' ? favorites.length : data.playlists.length; return <Pressable key={collection.id} accessibilityRole="button" accessibilityLabel={`Open ${collection.title}`} onPress={() => setView(collection.id)} style={styles.collectionRow}><View style={styles.collectionIcon}><Text style={styles.collectionGlyph}>{collection.id === 'liked' ? '♪' : collection.id === 'favorites' ? '♥' : '≡'}</Text></View><View style={styles.collectionCopy}><Text style={styles.collectionTitle}>{collection.title}</Text><Text style={styles.collectionSubtitle}>{collection.subtitle}</Text></View><Text style={styles.count}>{count}</Text><Text style={styles.chevron}>›</Text></Pressable>; })}</View>
    </>}

    {(view === 'liked' || view === 'favorites') && (() => { const songs = view === 'liked' ? data.likedSongs : favorites; const source = view === 'liked' ? 'liked' : 'favorites'; const empty = view === 'liked' ? libraryCollectionDefinitions[0].emptyMessage : libraryCollectionDefinitions[1].emptyMessage; return <><Text style={styles.subtitle}>{view === 'liked' ? 'Everything you saved from search results.' : 'Songs you marked for quick return.'}</Text><View style={styles.playActions}><Pressable accessibilityRole="button" accessibilityLabel={`Shuffle ${title}`} onPress={() => play(songs, 'shuffle', source)} style={styles.outlineButton}><Text style={styles.outlineButtonText}>⇄ Shuffle</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Play all ${title}`} onPress={() => play(songs, 'repeat-all', source)} style={styles.playButton}><Text style={styles.playButtonText}>▶ Play all</Text></Pressable></View><View style={styles.section}>{status === 'loading' ? <Text style={styles.muted}>Loading your library…</Text> : songs.length === 0 ? <Text style={styles.empty}>{empty}</Text> : songs.map((song) => <SongRow key={song.id} song={song} favorite={isFavorite(song.id)} onFavorite={() => toggleFavorite(toToggleableSong(song))} onPlay={() => player.startSong(toToggleableSong(song))} />)}</View></>; })()}

    {view === 'playlists' && <><Text style={styles.subtitle}>Build a collection from the songs you find.</Text><View style={styles.section}><Text style={styles.sectionLabel}>NEW PLAYLIST</Text><TextInput accessibilityLabel="New playlist name" onChangeText={setNewPlaylistName} placeholder="Playlist name" placeholderTextColor="#BDB6A4" style={styles.input} value={newPlaylistName} /><Pressable accessibilityRole="button" accessibilityLabel="Create playlist" onPress={createPlaylist} style={styles.createButton}><Text style={styles.createText}>Create playlist</Text></Pressable></View><View style={styles.section}>{data.playlists.length === 0 ? <Text style={styles.empty}>{libraryCollectionDefinitions[2].emptyMessage}</Text> : data.playlists.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`} onPress={() => { setSelectedPlaylistId(item.id); setView('playlist'); }} style={styles.playlistRow}><View style={styles.playlistArtwork}><Text style={styles.playlistGlyph}>♪</Text></View><View style={styles.collectionCopy}><Text style={styles.collectionTitle}>{item.name}</Text><Text style={styles.collectionSubtitle}>{item.songs.length} song{item.songs.length === 1 ? '' : 's'}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}</View></>}

    {view === 'playlist' && playlist && <><View style={styles.playActions}><Pressable accessibilityRole="button" accessibilityLabel={`Play ${playlist.name}`} onPress={() => player.startQueue(playlist.songs)} style={styles.playButton}><Text style={styles.playButtonText}>▶ Play all</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${playlist.name}`} onPress={() => { removePlaylist(playlist.id); backToLibrary(); }} style={styles.deleteButton}><Text style={styles.delete}>Delete</Text></Pressable></View><View style={styles.section}><Text style={styles.sectionLabel}>RENAME PLAYLIST</Text><View style={styles.renameRow}><TextInput accessibilityLabel={`Rename ${playlist.name}`} onChangeText={setPlaylistRename} placeholder="New playlist name" placeholderTextColor="#BDB6A4" style={styles.renameInput} value={playlistRename} /><Pressable accessibilityRole="button" accessibilityLabel={`Rename ${playlist.name}`} onPress={() => { renamePlaylist(playlist.id, playlistRename); setPlaylistRename(''); }} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Rename</Text></Pressable></View></View><View style={styles.section}>{playlist.songs.length === 0 ? <Text style={styles.empty}>No songs in this playlist yet.</Text> : playlist.songs.map((song) => <SongRow key={song.id} song={song} onPlay={() => player.startSong(toToggleableSong(song))} trailing={<Pressable accessibilityRole="button" accessibilityLabel={`Remove ${song.title} from ${playlist.name}`} onPress={() => removeFromPlaylist(playlist.id, song.id)}><Text style={styles.remove}>Remove</Text></Pressable>} />)}</View><View style={styles.section}><Text style={styles.sectionLabel}>ADD FROM LIKED SONGS</Text>{data.likedSongs.filter((song) => !playlist.songs.some((saved) => saved.id === song.id)).map((song) => <View key={song.id} style={styles.addRow}><Text style={styles.membershipTitle}>{song.title} · {song.artist}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add ${song.title} to ${playlist.name}`} onPress={() => addToPlaylist(playlist.id, toToggleableSong(song))}><Text style={styles.add}>Add</Text></Pressable></View>)}</View></>}
  </ScrollView></SafeAreaView>;
}

export default function ExploreScreen() {
  return <LibraryScreen />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' }, content: { gap: 18, padding: 24, paddingBottom: 148 }, topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, backLink: { color: '#F7C948', fontWeight: '800' }, countBadge: { backgroundColor: '#25231C', borderColor: '#5A4A13', borderRadius: 16, borderWidth: 1, color: '#F7C948', fontSize: 12, fontWeight: '900', minWidth: 32, padding: 7, textAlign: 'center' }, hero: { gap: 7 }, kicker: { color: '#F7C948', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 }, title: { color: '#FFF7DF', fontSize: 36, fontWeight: '900' }, subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 23 }, section: { backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 18, borderWidth: 1, gap: 12, padding: 16 }, heading: { color: '#FFF7DF', fontSize: 20, fontWeight: '900' }, sectionLabel: { color: '#F7C948', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }, recentStrip: { gap: 12 }, recentCard: { gap: 5, width: 105 }, recentArtwork: { borderRadius: 10, height: 105, width: 105 }, recentTitle: { color: '#FFF7DF', fontSize: 13, fontWeight: '800' }, recentArtist: { color: '#BDB6A4', fontSize: 12 }, collectionList: { borderColor: '#3B372C', borderRadius: 18, borderWidth: 1, overflow: 'hidden' }, collectionRow: { alignItems: 'center', backgroundColor: '#181714', borderBottomColor: '#3B372C', borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 16 }, collectionIcon: { alignItems: 'center', backgroundColor: '#302B1B', borderRadius: 15, height: 46, justifyContent: 'center', width: 46 }, collectionGlyph: { color: '#F7C948', fontSize: 22, fontWeight: '900' }, collectionCopy: { flex: 1, gap: 3 }, collectionTitle: { color: '#FFF7DF', fontSize: 17, fontWeight: '900' }, collectionSubtitle: { color: '#BDB6A4', fontSize: 13, lineHeight: 18 }, count: { color: '#F7C948', fontWeight: '900' }, chevron: { color: '#D8CFB6', fontSize: 28, lineHeight: 28 }, playActions: { flexDirection: 'row', gap: 10 }, playButton: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 13, flex: 1, padding: 13 }, playButtonText: { color: '#0B0B0A', fontWeight: '900' }, outlineButton: { alignItems: 'center', borderColor: '#F7C948', borderRadius: 13, borderWidth: 1, flex: 1, padding: 13 }, outlineButtonText: { color: '#F7C948', fontWeight: '900' }, songRow: { alignItems: 'center', borderBottomColor: '#3B372C', borderBottomWidth: 1, flexDirection: 'row', gap: 8, paddingVertical: 10 }, songPress: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 11 }, artwork: { borderRadius: 9, height: 50, width: 50 }, artworkFallback: { alignItems: 'center', backgroundColor: '#F7C948', justifyContent: 'center' }, note: { color: '#0B0B0A', fontSize: 24, fontWeight: '900' }, songDetails: { flex: 1, gap: 2 }, songTitle: { color: '#FFF7DF', fontSize: 16, fontWeight: '800' }, artist: { color: '#BDB6A4', fontSize: 13 }, iconAction: { padding: 6 }, favorite: { color: '#D8CFB6', fontSize: 25 }, favoriteFilled: { color: '#F7C948' }, muted: { color: '#BDB6A4' }, empty: { color: '#D8CFB6', lineHeight: 22 }, error: { color: '#FFAAA8' }, input: { backgroundColor: '#0B0B0A', borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, color: '#FFF7DF', padding: 13 }, createButton: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 12, padding: 13 }, createText: { color: '#0B0B0A', fontWeight: '900' }, playlistRow: { alignItems: 'center', borderBottomColor: '#3B372C', borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingVertical: 10 }, playlistArtwork: { alignItems: 'center', backgroundColor: '#302B1B', borderRadius: 10, height: 54, justifyContent: 'center', width: 54 }, playlistGlyph: { color: '#F7C948', fontSize: 25, fontWeight: '900' }, deleteButton: { alignItems: 'center', borderColor: '#FFAAA8', borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: 'center' }, delete: { color: '#FFAAA8', fontWeight: '900' }, renameRow: { alignItems: 'center', flexDirection: 'row', gap: 8 }, renameInput: { backgroundColor: '#0B0B0A', borderColor: '#3B372C', borderRadius: 12, borderWidth: 1, color: '#FFF7DF', flex: 1, padding: 11 }, remove: { color: '#FFAAA8', fontWeight: '800' }, addRow: { alignItems: 'center', borderBottomColor: '#3B372C', borderBottomWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'space-between', paddingVertical: 10 }, membershipTitle: { color: '#D8CFB6', flex: 1 }, add: { color: '#F7C948', fontWeight: '900' },
});

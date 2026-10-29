import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import { ActivityIndicator, Keyboard, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateLyrics } from '../../lib/validation';
import { fetchWithTimeout } from '../../lib/request';
import { lyricDestination } from '../../lib/genius-links';
import { enrichMissingCatalog } from '../lib/itunes-catalog';
import { listeningUrl } from '../lib/listening-platforms';
import { addRecentSearch, parseRecentSearches, removeRecentSearch } from '../lib/recent-searches';
import { lyricHookPrompts, lyricInputLimit, searchScreenCopy } from '../lib/search-screen';
import { screenContentBottomInset } from '../components/music-ui';
import { SongResults } from '../components/song-results';
import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../contexts/preview-player-context';
import { useSongDetails } from '../contexts/song-details-context';
import type { SongResult } from '../types/song';

export default function Home() {
  const [lyrics, setLyrics] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const previewPlayer = usePreviewPlayer();
  const { openSong } = useSongDetails();
  const { addToPlaylist, data: library, error: libraryError, isFavorite, isLiked, toggleFavorite, toggleSong } = useLibrary();

  useEffect(() => {
    void AsyncStorage.getItem('@lyric-finder/recent-searches-v1').then((stored) => setRecentSearches(stored ? parseRecentSearches(stored) : [])).catch(() => setRecentSearches([]));
  }, []);

  function saveRecentSearch(query: string) {
    const next = addRecentSearch(recentSearches, query);
    setRecentSearches(next);
    void AsyncStorage.setItem('@lyric-finder/recent-searches-v1', JSON.stringify(next));
  }

  function deleteRecentSearch(query: string) {
    const next = removeRecentSearch(recentSearches, query);
    setRecentSearches(next);
    void AsyncStorage.setItem('@lyric-finder/recent-searches-v1', JSON.stringify(next));
  }

  async function openExternal(url: string | null, unavailableMessage: string) {
    if (!url) return setMessage(unavailableMessage);

    try {
      if (!(await Linking.canOpenURL(url))) return setMessage(unavailableMessage);
      await Linking.openURL(url);
    } catch {
      setMessage(unavailableMessage);
    }
  }

  async function search(query = lyrics) {
    const error = validateLyrics(query);
    if (error) return setMessage(error);
    const base = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!base || base.includes('example.workers.dev')) return setMessage('Add your live-search API URL to .env first.');

    setLoading(true);
    setMessage(null);
    setSongs([]);
    setHasSearched(false);

    try {
      const response = await fetchWithTimeout(`${base}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lyrics: query }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Search is temporarily unavailable.');
      const results = await Promise.all(
        (body.results as SongResult[]).map((song) => enrichMissingCatalog(song)),
      );
      setSongs(results);
      setHasSearched(true);
      saveRecentSearch(query);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Search is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <View style={s.brandRow}>
            <View style={s.brandMark}><Text style={s.motif}>♫</Text><Text style={s.kicker}>LYRIC FINDER</Text></View>
          </View>
          <Text style={s.eyebrow}>FIND THE SONG STUCK IN YOUR HEAD</Text>
          <Text style={s.title}>What lyrics do you remember?</Text>
          <Text style={s.subtitle}>A line, a phrase, even a half-remembered chorus.</Text>
        </View>

        <Text style={s.inputLabel}>{searchScreenCopy.inputLabel}</Text>
        <TextInput
          accessibilityLabel={searchScreenCopy.inputLabel}
          multiline
          blurOnSubmit
          maxLength={lyricInputLimit}
          onChangeText={setLyrics}
          onSubmitEditing={() => { Keyboard.dismiss(); void search(); }}
          placeholder="Type a line or two you remember…"
          placeholderTextColor="#BDB6A4"
          style={s.input}
          value={lyrics}
        />
        <View style={s.inputMeta}><Text style={s.helper}>{searchScreenCopy.helper}</Text><Text style={s.helper}>{lyrics.length}/{lyricInputLimit}</Text></View>
        <View style={s.hookSection}>
          <Text style={s.hookLabel}>Need a starting point?</Text>
          <Text style={s.hookHelper}>Try a repeated sound or memory fragment, then make it your own.</Text>
          <View style={s.hookList}>
            {lyricHookPrompts.map((prompt) => <Pressable accessibilityRole="button" accessibilityLabel={`Use lyric starter ${prompt}`} key={prompt} onPress={() => setLyrics(prompt)} style={s.hookChip}>
              <Text style={s.hookChipText}>{prompt}</Text>
            </Pressable>)}
          </View>
        </View>
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => { void search(); }} style={[s.button, loading && s.buttonDisabled]}>
          {loading ? <ActivityIndicator color="#0B0B0A" /> : <Text style={s.buttonText}>✦  {searchScreenCopy.submit}</Text>}
        </Pressable>
        {recentSearches.length > 0 && <View style={s.recentSection}>
          <View style={s.recentHeader}><Text style={s.recentTitle}>Recent searches</Text><Text style={s.recentCount}>{recentSearches.length}</Text></View>
          {recentSearches.map((query) => <View key={query} style={s.recentRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Search again for ${query}`} onPress={() => { setLyrics(query); void search(query); }} style={s.recentSearch}><Text style={s.searchGlyph}>⌕</Text><Text numberOfLines={1} style={s.recentText}>{query}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove recent search ${query}`} onPress={() => deleteRecentSearch(query)}><Text style={s.removeRecent}>×</Text></Pressable>
          </View>)}
        </View>}
        {message && <Text style={s.error}>{message}</Text>}
        {libraryError && <Text style={s.error}>{libraryError}</Text>}
        <SongResults
          songs={songs}
          hasSearched={hasSearched}
          isPlayingId={previewPlayer.isPlaying ? previewPlayer.currentSong?.id ?? null : null}
          onTogglePreview={previewPlayer.toggleSong}
          isSaved={isLiked}
          isFavorite={isFavorite}
          onViewLyrics={(song) => {
            const destination = lyricDestination(song, lyrics);
            if (destination.geniusUnavailable) {
              setMessage('Sorry, Genius did not have a direct lyrics page for this song. We opened a Google lyric search instead.');
            }
            return openExternal(destination.url, 'Sorry, the lyrics page or search could not be opened.');
          }}
          onListen={(song, platform) => openExternal(listeningUrl(song, platform), 'That music service could not be opened for this song.')}
          onToggleSaved={toggleSong}
          onToggleFavorite={toggleFavorite}
          playlists={library.playlists}
          onAddToPlaylist={addToPlaylist}
          onOpenDetails={(song) => { openSong(song); router.push('/song' as Href); }}
          onOpenArtist={(artist) => openExternal(`https://music.apple.com/us/search?term=${encodeURIComponent(artist)}`, 'That artist page could not be opened.')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' },
  content: { padding: 20, paddingBottom: screenContentBottomInset, gap: 14 },
  hero: { gap: 9, marginTop: 14 },
  brandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  brandMark: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  motif: { backgroundColor: '#F7C948', borderRadius: 16, color: '#0B0B0A', fontSize: 19, fontWeight: '900', height: 32, lineHeight: 31, textAlign: 'center', width: 32 },
  kicker: { color: '#F7C948', fontWeight: '800', letterSpacing: 2 },
  eyebrow: { color: '#F7C948', fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: 20 },
  title: { color: '#FFF7DF', fontSize: 36, fontWeight: '800', letterSpacing: -1.25, lineHeight: 39 },
  subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 24 },
  inputLabel: { color: '#FFF7DF', fontSize: 14, fontWeight: '800', marginTop: 16 },
  input: {
    minHeight: 150,
    color: '#FFF7DF',
    backgroundColor: '#181714',
    borderColor: '#3B372C',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    textAlignVertical: 'top',
    fontSize: 17,
  },
  inputMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  helper: { color: '#AAA69C', fontSize: 12 },
  hookSection: { backgroundColor: '#12120F', borderColor: '#302D24', borderRadius: 14, borderWidth: 1, gap: 6, padding: 12 },
  hookLabel: { color: '#FFF7DF', fontSize: 14, fontWeight: '800' },
  hookHelper: { color: '#AAA69C', fontSize: 12, lineHeight: 17 },
  hookList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  hookChip: { backgroundColor: '#242116', borderColor: '#524523', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  hookChipText: { color: '#F7C948', fontSize: 12, fontWeight: '800' },
  button: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 999, justifyContent: 'center', minHeight: 55 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#0B0B0A', fontWeight: '800', fontSize: 17 },
  error: { color: '#FFAAA8' },
  recentSection: { backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 18, borderWidth: 1, gap: 8, marginTop: 12, padding: 14 },
  recentHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  recentTitle: { color: '#FFF7DF', fontSize: 20, fontWeight: '900' },
  recentCount: { backgroundColor: '#302B1B', borderRadius: 16, color: '#F7C948', fontSize: 12, fontWeight: '900', minWidth: 28, padding: 6, textAlign: 'center' },
  recentRow: { alignItems: 'center', borderTopColor: '#3B372C', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingTop: 9 },
  recentSearch: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  searchGlyph: { color: '#AAA69C', fontSize: 18 },
  recentText: { color: '#FFF7DF' },
  removeRecent: { color: '#FFAAA8', fontSize: 23, fontWeight: '700', lineHeight: 23, paddingHorizontal: 5 },
});

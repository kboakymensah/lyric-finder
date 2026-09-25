import { useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateLyrics } from '../../lib/validation';
import { fetchWithTimeout } from '../../lib/request';
import { lyricDestination } from '../../lib/genius-links';
import { enrichMissingCatalog } from '../lib/itunes-catalog';
import { listeningUrl } from '../lib/listening-platforms';
import { SongResults } from '../components/song-results';
import { useLibrary } from '../contexts/library-context';
import { usePreviewPlayer } from '../hooks/use-preview-player';
import type { SongResult } from '../types/song';

export default function Home() {
  const [lyrics, setLyrics] = useState('');
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { playingId, togglePreview } = usePreviewPlayer();
  const { addToPlaylist, data: library, error: libraryError, isLiked, toggleSong } = useLibrary();

  async function openExternal(url: string | null, unavailableMessage: string) {
    if (!url) return setMessage(unavailableMessage);

    try {
      if (!(await Linking.canOpenURL(url))) return setMessage(unavailableMessage);
      await Linking.openURL(url);
    } catch {
      setMessage(unavailableMessage);
    }
  }

  async function search() {
    const error = validateLyrics(lyrics);
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
        body: JSON.stringify({ lyrics }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Search is temporarily unavailable.');
      const results = await Promise.all(
        (body.results as SongResult[]).map((song) => enrichMissingCatalog(song)),
      );
      setSongs(results);
      setHasSearched(true);
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
          <Text style={s.motif}>♪  ✎  ♫</Text>
          <Text style={s.kicker}>LYRIC FINDER</Text>
          <Text style={s.title}>What lyrics do you remember?</Text>
          <Text style={s.subtitle}>A line, a phrase, even a half-remembered chorus.</Text>
        </View>

        <TextInput
          accessibilityLabel="Lyrics"
          multiline
          onChangeText={setLyrics}
          placeholder="Type a line or two you remember…"
          placeholderTextColor="#BDB6A4"
          style={s.input}
          value={lyrics}
        />
        {message && <Text style={s.error}>{message}</Text>}
        {libraryError && <Text style={s.error}>{libraryError}</Text>}
        <Pressable accessibilityRole="button" disabled={loading} onPress={search} style={[s.button, loading && s.buttonDisabled]}>
          {loading ? <ActivityIndicator color="#0B0B0A" /> : <Text style={s.buttonText}>Find my song</Text>}
        </Pressable>
        <Link href="/explore" style={s.libraryLink}>Open my library</Link>

        <SongResults
          songs={songs}
          hasSearched={hasSearched}
          isPlayingId={playingId}
          onTogglePreview={togglePreview}
          isSaved={isLiked}
          onViewLyrics={(song) => {
            const destination = lyricDestination(song, lyrics);
            if (destination.geniusUnavailable) {
              setMessage('Sorry, Genius did not have a direct lyrics page for this song. We opened a Google lyric search instead.');
            }
            return openExternal(destination.url, 'Sorry, the lyrics page or search could not be opened.');
          }}
          onListen={(song, platform) => openExternal(listeningUrl(song, platform), 'That music service could not be opened for this song.')}
          onToggleSaved={toggleSong}
          playlists={library.playlists}
          onAddToPlaylist={addToPlaylist}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' },
  content: { padding: 24, paddingBottom: 48, gap: 16 },
  hero: { gap: 8, marginTop: 20 },
  motif: { color: '#F7C948', fontSize: 22, letterSpacing: 5 },
  kicker: { color: '#F7C948', fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFF7DF', fontSize: 36, fontWeight: '800', lineHeight: 42 },
  subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 24 },
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
  button: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 16, padding: 18 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#0B0B0A', fontWeight: '800', fontSize: 17 },
  libraryLink: { alignSelf: 'center', color: '#F7C948', fontSize: 16, fontWeight: '800', paddingVertical: 4 },
  error: { color: '#FFAAA8' },
});

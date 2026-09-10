import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateLyrics } from '../../lib/validation';
import { fetchWithTimeout } from '../../lib/request';
import { SongResults } from '../components/song-results';
import type { SongResult } from '../types/song';

export default function Home() {
  const [lyrics, setLyrics] = useState('');
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  async function search() {
    const error = validateLyrics(lyrics);
    if (error) return setMessage(error);
    const base = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!base || base.includes('example.workers.dev')) return setMessage('Add your live-search API URL to .env first.');

    setLoading(true);
    setMessage(null);
    setSongs([]);
    setHasSearched(false);
    setIsPlayingId(null);

    try {
      const response = await fetchWithTimeout(`${base}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lyrics }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Search is temporarily unavailable.');
      setSongs(body.results);
      setHasSearched(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Search is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  function togglePreview(song: SongResult) {
    setIsPlayingId((currentId) => currentId === song.id ? null : song.id);
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
        <Pressable accessibilityRole="button" disabled={loading} onPress={search} style={[s.button, loading && s.buttonDisabled]}>
          {loading ? <ActivityIndicator color="#0B0B0A" /> : <Text style={s.buttonText}>Find my song</Text>}
        </Pressable>

        <SongResults
          songs={songs}
          hasSearched={hasSearched}
          isPlayingId={isPlayingId}
          onTogglePreview={togglePreview}
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
  error: { color: '#FFAAA8' },
});

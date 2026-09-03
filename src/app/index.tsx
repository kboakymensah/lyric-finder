import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateLyrics } from '../../lib/validation';
import { fetchWithTimeout } from '../../lib/request';

type Song = { id: string; title: string; artist: string; lyricSnippet?: string; listenUrl?: string };

export default function Home() {
  const [lyrics, setLyrics] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function search() {
    const error = validateLyrics(lyrics);
    if (error) return setMessage(error);
    const base = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!base || base.includes('example.workers.dev')) return setMessage('Add your live-search API URL to .env first.');
    setLoading(true); setMessage(null); setSongs([]);
    try { const response = await fetchWithTimeout(`${base}/search`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lyrics }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? 'Search is temporarily unavailable.'); setSongs(body.results); } catch (e) { setMessage(e instanceof Error ? e.message : 'Search is temporarily unavailable.'); } finally { setLoading(false); }
  }
  return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content}><Text style={s.kicker}>LYRIC FINDER</Text><Text style={s.title}>What lyrics do you remember?</Text><Text style={s.subtitle}>A line, a phrase, even a half-remembered chorus.</Text><TextInput accessibilityLabel="Lyrics" multiline value={lyrics} onChangeText={setLyrics} placeholder="Type a line or two you remember…" placeholderTextColor="#8790aa" style={s.input}/>{message && <Text style={s.error}>{message}</Text>}<Pressable style={s.button} onPress={search} disabled={loading}>{loading ? <ActivityIndicator/> : <Text style={s.buttonText}>Find my song</Text>}</Pressable>{songs.map(song => <View key={song.id} style={s.card}><View style={s.art}><Text>♫</Text></View><View style={{flex:1}}><Text style={s.song}>{song.title}</Text><Text style={s.artist}>{song.artist}</Text>{song.lyricSnippet && <Text style={s.snippet}>“{song.lyricSnippet}”</Text>}</View>{song.listenUrl && <Pressable onPress={() => Linking.openURL(song.listenUrl!)}><Text style={s.listen}>Listen</Text></Pressable>}</View>)}</ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0d1020'},content:{padding:24,gap:16},kicker:{color:'#a9f53f',fontWeight:'800',letterSpacing:2,marginTop:20},title:{color:'white',fontSize:36,fontWeight:'800'},subtitle:{color:'#b2bad2',fontSize:16},input:{minHeight:150,color:'white',backgroundColor:'#1a1e33',borderRadius:18,padding:18,textAlignVertical:'top',fontSize:17},button:{backgroundColor:'#a9f53f',padding:18,borderRadius:16,alignItems:'center'},buttonText:{fontWeight:'800',fontSize:17},error:{color:'#ff9ea3'},card:{flexDirection:'row',gap:12,alignItems:'center',padding:14,borderRadius:16,backgroundColor:'#171b2e'},art:{width:50,height:50,borderRadius:10,backgroundColor:'#a9f53f',alignItems:'center',justifyContent:'center'},song:{color:'white',fontWeight:'700'},artist:{color:'#b2bad2'},snippet:{color:'#d3d9ef',fontSize:12},listen:{color:'#a9f53f',fontWeight:'800'}});

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeLyricIndex, type TimedLyricLine } from '../lib/synced-lyrics';

type SyncedLyricsProps = { lines: TimedLyricLine[]; currentSeconds: number; isLoading: boolean; message: string | null };

export function SyncedLyrics({ lines, currentSeconds, isLoading, message }: SyncedLyricsProps) {
  if (isLoading) return <Text style={styles.muted}>Loading timed lyrics…</Text>;
  if (message) return <Text style={styles.message}>{message}</Text>;
  const activeIndex = activeLyricIndex(lines, currentSeconds);
  return <ScrollView style={styles.panel}>{lines.map((line, index) => <View key={`${line.timeSeconds}-${index}`}><Text style={[styles.line, index === activeIndex && styles.active]}>{line.text}</Text></View>)}</ScrollView>;
}

const styles = StyleSheet.create({ panel: { maxHeight: 180 }, line: { color: '#BDB6A4', paddingVertical: 5 }, active: { color: '#F7C948', fontWeight: '800' }, muted: { color: '#BDB6A4' }, message: { color: '#FFAAA8' } });

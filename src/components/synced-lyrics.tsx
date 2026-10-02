import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { activeLyricIndex, type TimedLyricLine } from '../lib/synced-lyrics';

type SyncedLyricsProps = { lines: TimedLyricLine[]; currentSeconds: number; isLoading: boolean; message: string | null; expanded?: boolean; canHighlight?: boolean };

export function SyncedLyrics({ lines, currentSeconds, isLoading, message, expanded = false, canHighlight = true }: SyncedLyricsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = canHighlight ? activeLyricIndex(lines, currentSeconds) : null;
  useEffect(() => { if (canHighlight && activeIndex !== null) scrollRef.current?.scrollTo({ y: Math.max(0, (activeIndex * 34) - 68), animated: true }); }, [activeIndex, canHighlight]);
  if (isLoading) return <Text style={styles.muted}>Loading timed lyrics…</Text>;
  if (message) return <Text style={styles.message}>{message}</Text>;
  const lyricLines = lines.map((line, index) => <View key={`${line.timeSeconds}-${index}`}><Text style={[styles.line, index === activeIndex && styles.active]}>{line.text}</Text></View>);
  const explanation = !canHighlight && <Text style={styles.explanation}>Lyrics are shown for reference; this preview excerpt cannot be line-synced.</Text>;
  return expanded ? <View>{explanation}{lyricLines}</View> : <ScrollView ref={scrollRef} style={styles.panel}>{explanation}{lyricLines}</ScrollView>;
}

const styles = StyleSheet.create({ panel: { maxHeight: 180 }, line: { color: '#BDB6A4', paddingVertical: 5 }, active: { color: '#F7C948', fontWeight: '800' }, muted: { color: '#BDB6A4' }, message: { color: '#FFAAA8' }, explanation: { color: '#BDB6A4', fontSize: 12, lineHeight: 18, marginBottom: 8 } });

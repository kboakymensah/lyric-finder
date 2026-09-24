import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HumSpikeScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('This feasibility test records a short hum. It does not identify songs yet.');

  async function startRecording() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setMessage('Microphone permission is needed to record a hum.');
      return;
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    setMessage('Recording your hum… tap Stop when you are finished.');
  }

  async function stopRecording() {
    await recorder.stop();
    setIsRecording(false);
    setMessage('Recording captured. Playback and basic analysis are the next step in this spike.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Link href="/" style={styles.backLink}>← Back to search</Link>
        <View style={styles.hero}>
          <Text style={styles.kicker}>PROTOTYPE 3 SPIKE</Text>
          <Text style={styles.title}>Hum a melody</Text>
          <Text style={styles.subtitle}>Testing microphone recording before attempting any future melody-search feature.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.status}>{isRecording || recorderState.isRecording ? '● Recording' : 'Ready to record'}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            accessibilityLabel={isRecording ? 'Stop humming recording' : 'Start humming recording'}
            accessibilityRole="button"
            onPress={isRecording ? stopRecording : startRecording}
            style={[styles.button, isRecording && styles.stopButton]}
          >
            <Text style={styles.buttonText}>{isRecording ? 'Stop recording' : 'Start humming'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0A' },
  content: { gap: 18, padding: 24, paddingBottom: 48 },
  backLink: { color: '#F7C948', fontWeight: '800', marginTop: 8 },
  hero: { gap: 7, marginTop: 8 },
  kicker: { color: '#F7C948', fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFF7DF', fontSize: 36, fontWeight: '800' },
  subtitle: { color: '#BDB6A4', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#181714', borderColor: '#3B372C', borderRadius: 16, borderWidth: 1, gap: 16, padding: 18 },
  status: { color: '#F7C948', fontSize: 18, fontWeight: '800' },
  message: { color: '#D8CFB6', lineHeight: 22 },
  button: { alignItems: 'center', backgroundColor: '#F7C948', borderRadius: 12, padding: 15 },
  stopButton: { backgroundColor: '#FFAAA8' },
  buttonText: { color: '#0B0B0A', fontSize: 16, fontWeight: '800' },
});

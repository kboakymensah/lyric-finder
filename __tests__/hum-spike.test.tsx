import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const recorder = {
  prepareToRecordAsync: vi.fn(),
  record: vi.fn(),
  stop: vi.fn(),
  uri: null as string | null,
};

vi.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: vi.fn(async () => ({ granted: true })),
  useAudioRecorder: () => recorder,
  useAudioRecorderState: () => ({ durationMillis: 0, isRecording: false }),
}));

vi.mock('expo-router', () => ({ Link: 'Link' }));

vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  View: 'View',
}));

import HumSpikeScreen from '../src/app/hum-spike';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('HumSpikeScreen', () => {
  it('requests microphone permission and starts a humming recording', async () => {
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<HumSpikeScreen />);
    });

    await act(async () => {
      await screen!.root.findByProps({ accessibilityLabel: 'Start humming recording' }).props.onPress();
    });

    expect(recorder.prepareToRecordAsync).toHaveBeenCalledOnce();
    expect(recorder.record).toHaveBeenCalledOnce();
  });

  it('stops the active humming recording', async () => {
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<HumSpikeScreen />);
    });
    await act(async () => {
      await screen!.root.findByProps({ accessibilityLabel: 'Start humming recording' }).props.onPress();
    });

    await act(async () => {
      await screen!.root.findByProps({ accessibilityLabel: 'Stop humming recording' }).props.onPress();
    });

    expect(recorder.stop).toHaveBeenCalledOnce();
  });
});

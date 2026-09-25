import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

const recorder = {
  prepareToRecordAsync: vi.fn(),
  record: vi.fn(),
  stop: vi.fn(),
  uri: null as string | null,
};

const player = {
  play: vi.fn(),
  replace: vi.fn(),
};

const audioMocks = vi.hoisted(() => ({ setAudioModeAsync: vi.fn() }));

vi.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: audioMocks.setAudioModeAsync,
  requestRecordingPermissionsAsync: vi.fn(async () => ({ granted: true })),
  useAudioPlayer: () => player,
  useAudioRecorder: () => recorder,
  useAudioRecorderState: () => ({ durationMillis: 1250, isRecording: false }),
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

    expect(audioMocks.setAudioModeAsync).toHaveBeenCalledWith({ allowsRecording: true, playsInSilentMode: true });
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

  it('shows the captured recording details and replays the hum', async () => {
    recorder.uri = 'file:///cache/hum.m4a';
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

    const text = screen!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''));
    expect(text).toContain('Duration: 1.3 seconds');
    expect(text).toContain('Recording saved: file:///cache/hum.m4a');

    act(() => screen!.root.findByProps({ accessibilityLabel: 'Replay humming recording' }).props.onPress());
    expect(player.replace).toHaveBeenCalledWith('file:///cache/hum.m4a');
    expect(player.play).toHaveBeenCalledOnce();
  });
});

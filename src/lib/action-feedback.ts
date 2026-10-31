import { Vibration } from 'react-native';

/** A short, native tactile acknowledgement for save, favorite, and playlist actions. */
export function provideActionFeedback(vibrate: (pattern: number) => void = Vibration.vibrate) {
  vibrate(25);
}

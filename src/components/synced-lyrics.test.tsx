import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ ScrollView: 'ScrollView', StyleSheet: { create: <T,>(styles: T) => styles }, Text: 'Text', View: 'View' }));

import { SyncedLyrics } from './synced-lyrics';

const lines = [{ timeSeconds: 1, text: 'First' }, { timeSeconds: 10, text: 'Second' }];

describe('SyncedLyrics', () => {
  it('renders loading and unavailable states', () => {
    let panel: ReturnType<typeof create>;
    act(() => { panel = create(<SyncedLyrics lines={[]} currentSeconds={0} isLoading message={null} />); });
    expect(panel!.root.findByProps({ children: 'Loading timed lyrics…' })).toBeTruthy();
    act(() => { panel!.update(<SyncedLyrics lines={[]} currentSeconds={0} isLoading={false} message="Timed lyrics aren’t available for this song." />); });
    expect(panel!.root.findByProps({ children: 'Timed lyrics aren’t available for this song.' })).toBeTruthy();
  });

  it('renders the active lyric line', () => {
    let panel: ReturnType<typeof create>;
    act(() => { panel = create(<SyncedLyrics lines={lines} currentSeconds={10} isLoading={false} message={null} />); });
    expect(panel!.root.findByProps({ children: 'Second' })).toBeTruthy();
  });
});

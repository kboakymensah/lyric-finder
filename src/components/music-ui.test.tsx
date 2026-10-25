import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  View: 'View',
}));

import { ArtworkTile, CompactSongRow, ScreenContainer, screenContentBottomInset } from './music-ui';

describe('music UI primitives', () => {
  it('labels a missing artwork tile honestly', () => {
    let screen: ReturnType<typeof create>;
    act(() => { screen = create(<ArtworkTile artworkUrl={null} title="No Artwork Song" size={56} />); });

    expect(screen!.root.findByProps({ accessibilityLabel: 'No Artwork Song artwork unavailable' })).toBeTruthy();
  });

  it('calls a compact song row press handler', () => {
    const onPress = vi.fn();
    let screen: ReturnType<typeof create>;
    act(() => { screen = create(<CompactSongRow title="Golden" artist="Jill Scott" artworkUrl={null} onPress={onPress} />); });

    act(() => screen!.root.findByProps({ accessibilityLabel: 'Open Golden by Jill Scott' }).props.onPress());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reserves shared space beneath scrolling screen content', () => {
    let screen: ReturnType<typeof create>;
    act(() => { screen = create(<ScreenContainer><></></ScreenContainer>); });

    expect(screen!.root.findByProps({ testID: 'screen-content' }).props.contentContainerStyle.paddingBottom)
      .toBe(screenContentBottomInset);
  });
});

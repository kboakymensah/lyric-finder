import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({
  Animated: { Value: class { interpolate() { return ''; } }, timing: () => ({ start: () => {} }) },
  Pressable: 'Pressable',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  View: 'View',
}));

import { favoriteGlyph, primaryActionLabels } from './song-result-card';

describe('favorite action', () => {
  it('uses a filled star for songs in Favorites', () => {
    expect(favoriteGlyph(true)).toBe('★');
    expect(favoriteGlyph(false)).toBe('☆');
  });
});

describe('primary result actions', () => {
  it('puts lyrics, preview, and listening before playlist tools', () => {
    expect(primaryActionLabels).toEqual([
      'View Lyrics',
      'Play 30-second Preview',
      'Listen on…',
      'Add to Playlist',
    ]);
  });
});

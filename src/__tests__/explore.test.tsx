import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('expo-router', () => ({ Link: 'Link' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('../contexts/library-context', () => ({ useLibrary: vi.fn() }));
vi.mock('../contexts/preview-player-context', () => ({ usePreviewPlayer: vi.fn() }));

import { libraryCollectionDefinitions } from '../app/explore';

describe('library collection navigation', () => {
  it('defines focused entry points for liked songs, favorites, and playlists', () => {
    expect(libraryCollectionDefinitions.map((collection) => collection.title)).toEqual([
      'Liked Songs',
      'Favorites',
      'Playlists',
    ]);
  });

  it('gives each empty collection a next-step message', () => {
    expect(libraryCollectionDefinitions.map((collection) => collection.emptyMessage)).toEqual([
      'Save a song from your search results to start your library.',
      'Tap the star on a liked song to add it to Favorites.',
      'Create a playlist to organize songs from your search results.',
    ]);
  });
});

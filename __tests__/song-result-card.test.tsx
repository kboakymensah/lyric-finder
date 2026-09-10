import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: 'Text',
  View: 'View',
}));

import { SongResultCard } from '../src/components/song-result-card';
import { SongResults } from '../src/components/song-results';
import type { SongResult } from '../src/types/song';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const song: SongResult = {
  id: 'hello-adele',
  title: 'Hello',
  artist: 'Adele',
  artworkUrl: null,
  lyricSnippet: 'Hello from the other side',
  previewUrl: 'https://example.test/hello-preview.m4a',
  listenUrl: 'https://example.test/hello',
  matchScore: 100,
};

describe('SongResultCard', () => {
  it('shows title, artist, artwork fallback, and lyric snippet', () => {
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard song={song} emphasis="best" isPlaying={false} onTogglePreview={vi.fn()} />,
      );
    });

    const text = card!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''));
    expect(text).toContain('Hello');
    expect(text).toContain('Adele');
    expect(text).toContain('♫');
    expect(text).toContain('“Hello from the other side”');
  });

  it('shows Preview only when a preview URL is available', () => {
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard
          song={{ ...song, previewUrl: null }}
          emphasis="alternative"
          isPlaying={false}
          onTogglePreview={vi.fn()}
        />,
      );
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Preview Hello' })).toHaveLength(0);
  });
});

describe('SongResults', () => {
  it('groups the best match separately and omits alternatives heading when there are none', () => {
    let results: ReturnType<typeof create>;
    act(() => {
      results = create(
        <SongResults songs={[song]} hasSearched isPlayingId={null} onTogglePreview={vi.fn()} />,
      );
    });

    const text = results!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''));
    expect(text).toContain('Best match');
    expect(text).not.toContain('More possible songs');
  });
});

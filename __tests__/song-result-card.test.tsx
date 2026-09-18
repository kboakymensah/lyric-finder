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
  lyricsUrl: 'https://example.test/hello-lyrics',
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
        <SongResultCard
          song={song}
          emphasis="best"
          isPlaying={false}
          isSaved={false}
          onTogglePreview={vi.fn()}
          onViewLyrics={vi.fn()}
          onListen={vi.fn()}
          onToggleSaved={vi.fn()}
        />,
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
          isSaved={false}
          onTogglePreview={vi.fn()}
          onViewLyrics={vi.fn()}
          onListen={vi.fn()}
          onToggleSaved={vi.fn()}
        />,
      );
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Preview Hello' })).toHaveLength(0);
  });

  it('changes the available preview action from Preview to Pause while playing', () => {
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard
          song={song}
          emphasis="best"
          isPlaying
          isSaved={false}
          onTogglePreview={vi.fn()}
          onViewLyrics={vi.fn()}
          onListen={vi.fn()}
          onToggleSaved={vi.fn()}
        />,
      );
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Pause Hello' })).toHaveLength(1);
  });

  it('invokes the visible lyric, listen, and save controls with its song', () => {
    const onViewLyrics = vi.fn();
    const onListen = vi.fn();
    const onToggleSaved = vi.fn();
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard
          song={song}
          emphasis="best"
          isPlaying={false}
          isSaved={false}
          onTogglePreview={vi.fn()}
          onViewLyrics={onViewLyrics}
          onListen={onListen}
          onToggleSaved={onToggleSaved}
        />,
      );
    });

    act(() => card!.root.findByProps({ accessibilityLabel: 'View lyrics for Hello' }).props.onPress());
    act(() => card!.root.findByProps({ accessibilityLabel: 'Listen to Hello' }).props.onPress());
    act(() => card!.root.findByProps({ accessibilityLabel: 'Save Hello' }).props.onPress());

    expect(onViewLyrics).toHaveBeenCalledWith(song);
    expect(onListen).toHaveBeenCalledWith(song);
    expect(onToggleSaved).toHaveBeenCalledWith(song);
  });

  it('hides View Lyrics when no lyrics URL is available', () => {
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard
          song={{ ...song, lyricsUrl: null }}
          emphasis="best"
          isPlaying={false}
          isSaved={false}
          onTogglePreview={vi.fn()}
          onViewLyrics={vi.fn()}
          onListen={vi.fn()}
          onToggleSaved={vi.fn()}
        />,
      );
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'View lyrics for Hello' })).toHaveLength(0);
  });

  it('labels the save control as removing a saved song', () => {
    let card: ReturnType<typeof create>;
    act(() => {
      card = create(
        <SongResultCard
          song={song}
          emphasis="best"
          isPlaying={false}
          isSaved
          onTogglePreview={vi.fn()}
          onViewLyrics={vi.fn()}
          onListen={vi.fn()}
          onToggleSaved={vi.fn()}
        />,
      );
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Remove Hello from liked songs' })).toHaveLength(1);
  });
});

describe('SongResults', () => {
  it('shows no-results guidance after a search returns an empty list', () => {
    let results: ReturnType<typeof create>;
    act(() => {
      results = create(
        <SongResults songs={[]} hasSearched isPlayingId={null} onTogglePreview={vi.fn()} />,
      );
    });

    const text = results!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''));
    expect(text).toContain('No close lyric matches yet. Try another line from the chorus.');
  });

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

  it('forwards saved state and callbacks to best and alternative result cards', () => {
    const alternative = { ...song, id: 'rolling-in-the-deep', title: 'Rolling in the Deep' };
    const onViewLyrics = vi.fn();
    const onListen = vi.fn();
    const onToggleSaved = vi.fn();
    let results: ReturnType<typeof create>;
    act(() => {
      results = create(
        <SongResults
          songs={[song, alternative]}
          hasSearched
          isPlayingId={null}
          isSaved={(songId) => songId === alternative.id}
          onTogglePreview={vi.fn()}
          onViewLyrics={onViewLyrics}
          onListen={onListen}
          onToggleSaved={onToggleSaved}
        />,
      );
    });

    act(() => results!.root.findByProps({ accessibilityLabel: 'View lyrics for Hello' }).props.onPress());
    act(() => results!.root.findByProps({ accessibilityLabel: 'Listen to Rolling in the Deep' }).props.onPress());
    act(() => results!.root.findByProps({ accessibilityLabel: 'Remove Rolling in the Deep from liked songs' }).props.onPress());

    expect(onViewLyrics).toHaveBeenCalledWith(song);
    expect(onListen).toHaveBeenCalledWith(alternative);
    expect(onToggleSaved).toHaveBeenCalledWith(alternative);
  });
});

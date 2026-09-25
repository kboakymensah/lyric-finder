import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-image', () => ({ Image: 'Image' }));
vi.mock('react-native', () => ({
  Animated: {
    View: 'AnimatedView',
    Value: class {
      interpolate() {
        return 'animated-background';
      }
    },
    timing: () => ({ start: () => {} }),
  },
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

  it('keeps a disabled preview bar visible when a preview URL is unavailable', () => {
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

    const unavailablePreview = card!.root.findByProps({ accessibilityLabel: 'Preview unavailable for Hello' });
    expect(unavailablePreview.props.disabled).toBe(true);
  });

  it('shows a platform-neutral listening button and a top-right liked button', () => {
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

    expect(card!.root.findAllByProps({ accessibilityLabel: 'View lyrics for Hello' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Play 30-second preview of Hello' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Choose where to listen to Hello' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Add Hello to liked songs' })).toHaveLength(1);
  });

  it('lets a result be added directly to a selected playlist', () => {
    const onAddToPlaylist = vi.fn();
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
          playlists={[{ id: 'road-trip', name: 'Road Trip', songs: [] }]}
          onAddToPlaylist={onAddToPlaylist}
        />,
      );
    });

    act(() => card!.root.findByProps({ accessibilityLabel: 'Add Hello to a playlist' }).props.onPress());
    act(() => card!.root.findByProps({ accessibilityLabel: 'Add Hello to Road Trip' }).props.onPress());

    expect(onAddToPlaylist).toHaveBeenCalledWith('road-trip', song);
  });

  it('offers Apple Music, Spotify, and SoundCloud after choosing where to listen', () => {
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
    act(() => card!.root.findByProps({ accessibilityLabel: 'Choose where to listen to Hello' }).props.onPress());
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Listen to Hello on Apple Music' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Listen to Hello on Spotify' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Listen to Hello on SoundCloud' })).toHaveLength(1);
    expect(card!.root.findAllByProps({ accessibilityLabel: 'Listen to Hello on Search the web' })).toHaveLength(1);
    act(() => card!.root.findByProps({ accessibilityLabel: 'Listen to Hello on Spotify' }).props.onPress());
    act(() => card!.root.findByProps({ accessibilityLabel: 'Add Hello to liked songs' }).props.onPress());

    expect(onViewLyrics).toHaveBeenCalledWith(song);
    expect(onListen).toHaveBeenCalledWith(song, 'spotify');
    expect(onToggleSaved).toHaveBeenCalledWith(song);
  });

  it('keeps View Lyrics available when a result has no direct Genius URL', () => {
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

    expect(card!.root.findAllByProps({ accessibilityLabel: 'View lyrics for Hello' })).toHaveLength(1);
  });

  it('briefly confirms a successful playlist add before returning the bar to normal', () => {
    vi.useFakeTimers();
    const onAddToPlaylist = vi.fn();
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
          playlists={[{ id: 'road-trip', name: 'Road Trip', songs: [] }]}
          onAddToPlaylist={onAddToPlaylist}
        />,
      );
    });

    act(() => card!.root.findByProps({ accessibilityLabel: 'Add Hello to a playlist' }).props.onPress());
    act(() => card!.root.findByProps({ accessibilityLabel: 'Add Hello to Road Trip' }).props.onPress());

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Added Hello to a playlist' })).toHaveLength(1);
    expect(card!.root.findAll((node) => String(node.type) === 'Text').map((node) => node.children.join(''))).toContain('Added to Playlist ✓');

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(card!.root.findAllByProps({ accessibilityLabel: 'Add Hello to a playlist' })).toHaveLength(1);
    vi.useRealTimers();
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
    act(() => results!.root.findByProps({ accessibilityLabel: 'Choose where to listen to Rolling in the Deep' }).props.onPress());
    act(() => results!.root.findByProps({ accessibilityLabel: 'Listen to Rolling in the Deep on Apple Music' }).props.onPress());
    act(() => results!.root.findByProps({ accessibilityLabel: 'Remove Rolling in the Deep from liked songs' }).props.onPress());

    expect(onViewLyrics).toHaveBeenCalledWith(song);
    expect(onListen).toHaveBeenCalledWith(alternative, 'appleMusic');
    expect(onToggleSaved).toHaveBeenCalledWith(alternative);
  });
});

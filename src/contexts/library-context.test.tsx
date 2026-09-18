import { act, create } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { storage } = vi.hoisted(() => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));

import { LibraryProvider, useLibrary } from './library-context';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const song = {
  id: 'song-1',
  title: 'Golden Hour',
  artist: 'The Artist',
  artworkUrl: null,
  lyricsUrl: null,
  lyricSnippet: null,
  previewUrl: null,
  listenUrl: 'https://example.test/listen',
  matchScore: 1,
};

describe('LibraryProvider', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
  });

  it('loads the saved library before becoming ready', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify({
        likedSongs: [{ ...song, lyricSnippet: undefined, matchScore: undefined }],
        playlists: [],
      }),
    );

    let library: ReturnType<typeof useLibrary> | undefined;
    const Consumer = () => {
      library = useLibrary();
      return null;
    };

    await act(async () => {
      create(
        <LibraryProvider>
          <Consumer />
        </LibraryProvider>,
      );
    });

    expect(storage.getItem).toHaveBeenCalledWith('@lyric-finder/library-v1');
    expect(library!.status).toBe('ready');
    expect(library!.data.likedSongs).toEqual([
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        artworkUrl: song.artworkUrl,
        lyricsUrl: song.lyricsUrl,
        previewUrl: song.previewUrl,
        listenUrl: song.listenUrl,
      },
    ]);
  });

  it('updates the library immediately and saves each mutation', async () => {
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);

    let library: ReturnType<typeof useLibrary> | undefined;
    const Consumer = () => {
      library = useLibrary();
      return null;
    };

    await act(async () => {
      create(
        <LibraryProvider>
          <Consumer />
        </LibraryProvider>,
      );
    });

    act(() => library!.toggleSong(song));

    expect(library!.isLiked(song.id)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      '@lyric-finder/library-v1',
      JSON.stringify({
        likedSongs: [
          {
            id: song.id,
            title: song.title,
            artist: song.artist,
            artworkUrl: song.artworkUrl,
            lyricsUrl: song.lyricsUrl,
            previewUrl: song.previewUrl,
            listenUrl: song.listenUrl,
          },
        ],
        playlists: [],
      }),
    );
  });

  it('reports a readable error and keeps an empty library when loading fails', async () => {
    storage.getItem.mockRejectedValue(new Error('device unavailable'));

    let library: ReturnType<typeof useLibrary> | undefined;
    const Consumer = () => {
      library = useLibrary();
      return null;
    };

    await act(async () => {
      create(
        <LibraryProvider>
          <Consumer />
        </LibraryProvider>,
      );
    });

    expect(library!.status).toBe('ready');
    expect(library!.data).toEqual({ likedSongs: [], playlists: [] });
    expect(library!.error).toBe('Your saved library could not be loaded.');
  });

  it('reports a save error after applying the mutation', async () => {
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockRejectedValue(new Error('disk full'));

    let library: ReturnType<typeof useLibrary> | undefined;
    const Consumer = () => {
      library = useLibrary();
      return null;
    };

    await act(async () => {
      create(
        <LibraryProvider>
          <Consumer />
        </LibraryProvider>,
      );
    });

    await act(async () => {
      library!.toggleSong(song);
    });

    expect(library!.isLiked(song.id)).toBe(true);
    expect(library!.error).toBe('Your library changed, but it could not be saved on this device.');
  });

  it('throws when useLibrary is called outside its provider', () => {
    const Consumer = () => {
      useLibrary();
      return null;
    };

    expect(() => {
      act(() => {
        create(<Consumer />);
      });
    }).toThrow('useLibrary must be used within a LibraryProvider.');
  });
});

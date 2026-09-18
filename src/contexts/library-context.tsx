import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  emptyLibrary,
  parseLibrary,
  removeSongFromPlaylist,
  toSavedSong,
  toggleLikedSong,
  type LibraryData,
} from '../lib/library';
import type { SongResult } from '../types/song';

const STORAGE_KEY = '@lyric-finder/library-v1';
const LOAD_ERROR = 'Your saved library could not be loaded.';
const SAVE_ERROR = 'Your library changed, but it could not be saved on this device.';

type LibraryStatus = 'loading' | 'ready';

type LibraryContextValue = {
  data: LibraryData;
  status: LibraryStatus;
  error: string | null;
  isLiked: (songId: string) => boolean;
  toggleSong: (song: SongResult) => void;
  create: (name: string) => void;
  removePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LibraryData>(emptyLibrary);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const isHydratingRef = useRef(true);
  const pendingMutationsRef = useRef<Array<(library: LibraryData) => LibraryData>>([]);

  const persist = useCallback((nextData: LibraryData) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData))
      .then(() => setError(null))
      .catch(() => setError(SAVE_ERROR));
  }, []);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(STORAGE_KEY)
      .then((storedData) => {
        if (!active) return;

        const loadedData = storedData ? parseLibrary(storedData) : parseLibrary('');
        const rebasedData = pendingMutationsRef.current.reduce(
          (library, mutation) => mutation(library),
          loadedData,
        );
        const hadPendingMutations = pendingMutationsRef.current.length > 0;
        pendingMutationsRef.current = [];
        dataRef.current = rebasedData;
        setData(rebasedData);
        setError(null);
        if (hadPendingMutations) persist(rebasedData);
      })
      .catch(() => {
        if (!active) return;

        const initialData = pendingMutationsRef.current.reduce(
          (library, mutation) => mutation(library),
          parseLibrary(''),
        );
        pendingMutationsRef.current = [];
        dataRef.current = initialData;
        setData(initialData);
        setError(LOAD_ERROR);
      })
      .finally(() => {
        if (active) {
          isHydratingRef.current = false;
          setStatus('ready');
        }
      });

    return () => {
      active = false;
    };
  }, [persist]);

  const update = useCallback(
    (operation: (library: LibraryData) => LibraryData) => {
      if (isHydratingRef.current) pendingMutationsRef.current.push(operation);
      const nextData = operation(dataRef.current);
      dataRef.current = nextData;
      setData(nextData);
      persist(nextData);
    },
    [persist],
  );

  const create = useCallback(
    (name: string) => {
      let createdPlaylistId: string | null = null;

      update((library) => {
        const nextLibrary = createPlaylist(library, name);
        if (nextLibrary.playlists.length === library.playlists.length) return nextLibrary;

        const createdIndex = nextLibrary.playlists.length - 1;
        if (!createdPlaylistId) {
          createdPlaylistId = nextLibrary.playlists[createdIndex].id;
          return nextLibrary;
        }

        const replayedPlaylistId = createdPlaylistId;
        return {
          ...nextLibrary,
          playlists: nextLibrary.playlists.map((playlist, index) =>
            index === createdIndex ? { ...playlist, id: replayedPlaylistId } : playlist,
          ),
        };
      });
    },
    [update],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      data,
      status,
      error,
      isLiked: (songId) => data.likedSongs.some((song) => song.id === songId),
      toggleSong: (song) => update((library) => toggleLikedSong(library, toSavedSong(song))),
      create,
      removePlaylist: (playlistId) => update((library) => deletePlaylist(library, playlistId)),
      addToPlaylist: (playlistId, songId) =>
        update((library) => addSongToPlaylist(library, playlistId, songId)),
      removeFromPlaylist: (playlistId, songId) =>
        update((library) => removeSongFromPlaylist(library, playlistId, songId)),
    }),
    [create, data, error, status, update],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) {
    throw new Error('useLibrary must be used within a LibraryProvider.');
  }

  return library;
}

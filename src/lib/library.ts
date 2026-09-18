import type { SavedSong, SongResult } from '../types/song';

export type Playlist = { id: string; name: string; songs: SavedSong[] };
export type LibraryData = { likedSongs: SavedSong[]; playlists: Playlist[] };

export const emptyLibrary: LibraryData = { likedSongs: [], playlists: [] };

const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

const isSavedSong = (value: unknown): value is SavedSong => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const song = value as Record<string, unknown>;
  return (
    typeof song.id === 'string' &&
    typeof song.title === 'string' &&
    typeof song.artist === 'string' &&
    isNullableString(song.artworkUrl) &&
    isNullableString(song.lyricsUrl) &&
    isNullableString(song.previewUrl) &&
    typeof song.listenUrl === 'string'
  );
};

const isPlaylist = (value: unknown): value is Playlist =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as Playlist).id === 'string' &&
  typeof (value as Playlist).name === 'string' &&
  Array.isArray((value as Playlist).songs) &&
  (value as Playlist).songs.every(isSavedSong);

const isLegacyPlaylist = (value: unknown): value is { id: string; name: string; songIds: string[] } =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as { id?: unknown }).id === 'string' &&
  typeof (value as { name?: unknown }).name === 'string' &&
  Array.isArray((value as { songIds?: unknown }).songIds) &&
  (value as { songIds: unknown[] }).songIds.every((songId) => typeof songId === 'string');

const isLibraryData = (value: unknown): value is LibraryData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const library = value as Record<string, unknown>;
  return (
    Array.isArray(library.likedSongs) &&
    library.likedSongs.every(isSavedSong) &&
    Array.isArray(library.playlists) &&
    library.playlists.every(isPlaylist)
  );
};

const copyLibrary = (library: LibraryData): LibraryData => ({
  likedSongs: [...library.likedSongs],
  playlists: library.playlists.map((playlist) => ({ ...playlist, songs: [...playlist.songs] })),
});

export const parseLibrary = (storedLibrary: string): LibraryData => {
  try {
    const parsed = JSON.parse(storedLibrary);
    if (isLibraryData(parsed)) return copyLibrary(parsed);

    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { likedSongs?: unknown }).likedSongs) &&
      (parsed as { likedSongs: unknown[] }).likedSongs.every(isSavedSong) &&
      Array.isArray((parsed as { playlists?: unknown }).playlists) &&
      (parsed as { playlists: unknown[] }).playlists.every(isLegacyPlaylist)
    ) {
      const legacy = parsed as { likedSongs: SavedSong[]; playlists: Array<{ id: string; name: string; songIds: string[] }> };
      return {
        likedSongs: [...legacy.likedSongs],
        playlists: legacy.playlists.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          songs: playlist.songIds
            .map((songId) => legacy.likedSongs.find((song) => song.id === songId))
            .filter((song): song is SavedSong => Boolean(song)),
        })),
      };
    }

    return copyLibrary(emptyLibrary);
  } catch {
    return copyLibrary(emptyLibrary);
  }
};

export const toSavedSong = (song: SongResult): SavedSong => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  artworkUrl: song.artworkUrl,
  lyricsUrl: song.lyricsUrl,
  previewUrl: song.previewUrl,
  listenUrl: song.listenUrl,
});

export const toggleLikedSong = (library: LibraryData, song: SavedSong): LibraryData => {
  const isLiked = library.likedSongs.some((likedSong) => likedSong.id === song.id);
  return {
    ...copyLibrary(library),
    likedSongs: isLiked
      ? library.likedSongs.filter((likedSong) => likedSong.id !== song.id)
      : [...library.likedSongs, song],
  };
};

export const createPlaylist = (library: LibraryData, name: string): LibraryData => {
  const trimmedName = name.trim();
  const nextLibrary = copyLibrary(library);
  const hasDuplicate = library.playlists.some(
    (playlist) => playlist.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
  );

  if (!trimmedName || hasDuplicate) {
    return nextLibrary;
  }

  return {
    ...nextLibrary,
    playlists: [
      ...nextLibrary.playlists,
      { id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: trimmedName, songs: [] },
    ],
  };
};

export const deletePlaylist = (library: LibraryData, playlistId: string): LibraryData => ({
  ...copyLibrary(library),
  playlists: library.playlists
    .filter((playlist) => playlist.id !== playlistId)
    .map((playlist) => ({ ...playlist, songs: [...playlist.songs] })),
});

export const addSongToPlaylist = (
  library: LibraryData,
  playlistId: string,
  song: SavedSong,
): LibraryData => {
  return {
    ...copyLibrary(library),
    playlists: library.playlists.map((playlist) => {
      if (playlist.id !== playlistId || playlist.songs.some((savedSong) => savedSong.id === song.id)) {
        return { ...playlist, songs: [...playlist.songs] };
      }

      return { ...playlist, songs: [...playlist.songs, song] };
    }),
  };
};

export const removeSongFromPlaylist = (
  library: LibraryData,
  playlistId: string,
  songId: string,
): LibraryData => ({
  ...copyLibrary(library),
  playlists: library.playlists.map((playlist) =>
    playlist.id === playlistId
      ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) }
      : { ...playlist, songs: [...playlist.songs] },
  ),
});

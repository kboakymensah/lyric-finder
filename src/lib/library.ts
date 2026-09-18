import type { SavedSong, SongResult } from '../types/song';

export type Playlist = { id: string; name: string; songIds: string[] };
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

const isLibraryData = (value: unknown): value is LibraryData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const library = value as Record<string, unknown>;
  return (
    Array.isArray(library.likedSongs) &&
    library.likedSongs.every(isSavedSong) &&
    Array.isArray(library.playlists) &&
    library.playlists.every(
      (playlist) =>
        Boolean(playlist) &&
        typeof playlist === 'object' &&
        typeof (playlist as Playlist).id === 'string' &&
        typeof (playlist as Playlist).name === 'string' &&
        Array.isArray((playlist as Playlist).songIds) &&
        (playlist as Playlist).songIds.every((songId) => typeof songId === 'string'),
    )
  );
};

const copyLibrary = (library: LibraryData): LibraryData => ({
  likedSongs: [...library.likedSongs],
  playlists: library.playlists.map((playlist) => ({ ...playlist, songIds: [...playlist.songIds] })),
});

export const parseLibrary = (storedLibrary: string): LibraryData => {
  try {
    const parsed = JSON.parse(storedLibrary);
    return isLibraryData(parsed) ? copyLibrary(parsed) : copyLibrary(emptyLibrary);
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
      { id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: trimmedName, songIds: [] },
    ],
  };
};

export const deletePlaylist = (library: LibraryData, playlistId: string): LibraryData => ({
  ...copyLibrary(library),
  playlists: library.playlists
    .filter((playlist) => playlist.id !== playlistId)
    .map((playlist) => ({ ...playlist, songIds: [...playlist.songIds] })),
});

export const addSongToPlaylist = (
  library: LibraryData,
  playlistId: string,
  songId: string,
): LibraryData => {
  const isLiked = library.likedSongs.some((song) => song.id === songId);
  return {
    ...copyLibrary(library),
    playlists: library.playlists.map((playlist) => {
      if (playlist.id !== playlistId || !isLiked || playlist.songIds.includes(songId)) {
        return { ...playlist, songIds: [...playlist.songIds] };
      }

      return { ...playlist, songIds: [...playlist.songIds, songId] };
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
      ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) }
      : { ...playlist, songIds: [...playlist.songIds] },
  ),
});

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { SavedSong, SongResult } from '../types/song';

export type DetailSong = SongResult | SavedSong;

type SongDetailsContextValue = {
  song: DetailSong | null;
  openSong: (song: DetailSong) => void;
  clearSong: () => void;
};

const SongDetailsContext = createContext<SongDetailsContextValue | null>(null);

export function SongDetailsProvider({ children }: PropsWithChildren) {
  const [song, setSong] = useState<DetailSong | null>(null);
  const value = useMemo(() => ({ song, openSong: setSong, clearSong: () => setSong(null) }), [song]);
  return <SongDetailsContext.Provider value={value}>{children}</SongDetailsContext.Provider>;
}

export function useSongDetails() {
  const value = useContext(SongDetailsContext);
  if (!value) throw new Error('useSongDetails must be used within SongDetailsProvider');
  return value;
}

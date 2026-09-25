import type { SongResult } from '../types/song';

export type ListeningPlatform = 'appleMusic' | 'spotify' | 'soundcloud' | 'webSearch';

function songQuery(song: SongResult) {
  return encodeURIComponent(`${song.title} ${song.artist}`);
}

export function listeningUrl(song: SongResult, platform: ListeningPlatform) {
  const query = songQuery(song);

  if (platform === 'spotify') return `https://open.spotify.com/search/${query}`;
  if (platform === 'soundcloud') return `https://soundcloud.com/search/sounds?q=${query}`;
  if (platform === 'webSearch') return `https://www.google.com/search?q=${query}%20song`;
  if (song.listenUrl.includes('music.apple.com')) return song.listenUrl;
  return `https://music.apple.com/us/search?term=${query}`;
}

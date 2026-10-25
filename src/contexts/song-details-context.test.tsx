import { act, create } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';

import { SongDetailsProvider, useSongDetails } from './song-details-context';

const song = { id: 'song-1', title: 'Golden', artist: 'Jill Scott', artworkUrl: null, lyricsUrl: null, lyricSnippet: null, previewUrl: null, listenUrl: 'https://example.com', matchScore: 1 };

function Harness() {
  const details = useSongDetails();
  return <><button onClick={() => details.openSong(song)}>open</button><button onClick={details.clearSong}>clear</button><output>{details.song?.title ?? 'empty'}</output></>;
}

describe('SongDetailsProvider', () => {
  it('stores and clears the currently selected real song in memory', () => {
    let screen: ReturnType<typeof create>;
    act(() => { screen = create(<SongDetailsProvider><Harness /></SongDetailsProvider>); });

    act(() => screen!.root.findAllByType('button')[0].props.onClick());
    expect(screen!.root.findByType('output').children).toEqual(['Golden']);

    act(() => screen!.root.findAllByType('button')[1].props.onClick());
    expect(screen!.root.findByType('output').children).toEqual(['empty']);
  });
});

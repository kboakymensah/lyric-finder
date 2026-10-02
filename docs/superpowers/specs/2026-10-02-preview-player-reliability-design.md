# Preview Player Reliability Design

## Goal

Make Lyric Finder's in-app 30-second preview experience behave like a small music player: safe catalog previews, a fixed mini player with separate playback controls, reliable automatic queue progression, and honest lyric timing.

## Constraints

- Keep the Expo/React Native and Cloudflare Worker architecture.
- Use only public, key-free catalog services. iTunes remains the first catalog source; Deezer is a fallback only when it verifies the same recording.
- Do not play a similarly titled recording by a different artist.
- In-app audio remains a legal catalog-provided 30-second preview. Full playback continues to open an external music service.
- Do not claim that full-recording lyric timestamps are synchronized to a preview excerpt when the catalog does not provide its excerpt offset.

## Catalog Preview Resolution

The Worker first attempts the existing iTunes exact title/compatible-artist match. When iTunes has no preview, it queries Deezer's public search endpoint with the track title and artist.

A Deezer record is accepted only when its normalized title equals the lyric match title and its contributor list includes the lyric-match artist. Its preview URL, cover, and public track link can then fill missing catalog data. This covers recordings such as "Hellcats & Trackhawks," where Deezer credits Only The Family and Lil Durk but iTunes does not return the Lil Durk recording. A catalog failure leaves the lyric result intact with an unavailable-preview state and external listening options.

## Playback Architecture

The app-wide `PreviewPlayerProvider` changes from manually advancing one `AudioPlayer` to Expo Audio's native `AudioPlaylist` for one-song previews and library queues. The playlist owns completion and advancing to the next source, including shuffle and repeat modes. The provider maps the native current index and status back to the current `SongResult` or saved song used by the rest of the app.

The compact player becomes one persistent surface outside route scroll views. Artwork/title opens the full Now Playing modal. Play/pause, previous, and next are independent controls and never open the modal. Starting a preview no longer opens the modal automatically. When a queue advances, the mini player and modal change to the newly active song.

## Lyrics

LRCLIB supplies timestamps for a complete recording; iTunes and Deezer supply an excerpt with no published position within that recording. Therefore the app continues to show timestamped lyric text but only displays an active-line highlight when a reliable zero-offset source is known. Preview excerpts without an offset are labeled as unsynchronized instead of highlighting misleading lines from the beginning of the full song.

## User Flow

1. A lyric search returns matched songs plus catalog metadata and any legal 30-second preview.
2. A user presses a search result's preview control; it plays without opening Now Playing.
3. The fixed mini player appears. Its play/pause, previous, and next controls operate playback directly; tapping song information opens Now Playing.
4. Play All or Shuffle builds a native preview queue. On preview completion, native playlist playback advances and both player surfaces show the next song.
5. If an exact preview is unavailable, the result shows the unavailable state and lets the user open a chosen external service.

## Verification

- Unit-test iTunes-to-Deezer fallback acceptance and rejection for missing contributor matches.
- Unit-test native queue state mapping and automatic current-index changes.
- Component-test that mini-player controls do not open Now Playing while the information area does.
- Component-test that the active lyric highlight is suppressed for an unknown excerpt offset.
- Run the complete test suite and TypeScript check.
- Manually test an iTunes preview, Deezer fallback preview, Play All automatic advancement, mini-player controls, and unavailable preview handling on Expo Go.

# Synced preview lyrics design

## Goal

Give Lyric Finder users a music-player-style lyric experience during the existing in-app catalog preview. When a 30-second preview plays from either search results or My Library, the app should show timestamped lyrics, highlight the current line, and scroll that line into view.

The feature is limited to available preview audio. It does not provide full-song streaming or promise lyrics for every track.

## User experience

1. A user starts a preview from a search result or starts a saved-song/playlist queue in My Library.
2. The shared player begins audio immediately and requests synced lyrics for the active song in the background.
3. While lyrics load, the player shows a compact loading message.
4. If LRCLIB supplies timestamped lyrics, the app displays the lines below the player, highlights the line whose timestamp matches the current playback time, and scrolls the active line into view.
5. Pause, resume, previous, next, and ten-second seek controls update the highlighted line immediately.
6. If synced lyrics are unavailable, the player remains usable and displays: “Timed lyrics aren’t available for this song.” The existing View Lyrics action still opens the supplied Genius page or its existing web-search fallback.

## Architecture

### Shared preview player

The current search-result preview hook and Library playlist-preview hook will be consolidated behind an app-wide `PreviewPlayerProvider` and consumer hook. It is the sole owner of:

- active song and optional preview queue
- playback state and Expo Audio player instance
- playback position and duration
- play/pause, previous/next, and ten-second seek actions
- lyric request state, parsed timed lines, and lyric error state

Search-result cards use the provider to play one song. My Library uses it to start a queue made from playable saved songs. Both entry points render the same player panel, so lyric synchronization has one clock and one implementation.

### Free lyric lookup

The Cloudflare Worker gains an on-demand lyrics endpoint. The app sends the active track title and artist only after a user starts a preview. The Worker queries LRCLIB for that exact track, reads its public `syncedLyrics` field when available, parses valid LRC timestamps into a small JSON representation, and returns those timed lines.

No Genius page is scraped, no lyric-provider key is stored, and no paid service is required. Full lyric text is not placed in saved-song storage; it is fetched only for the currently playing preview.

### Lyrics display

`SyncedLyrics` is a presentational React Native component. It receives timed lines, current seconds, loading state, and unavailable/error state. A pure lyric-timing utility parses timestamps and selects the active line, making the timing rules independently testable.

The player panel contains the song details and controls. The lyric panel is visually attached beneath it but does not prevent the user from using the rest of the screen.

## Data flow

```text
Search result or Library queue
        -> PreviewPlayerProvider.start(song or queue)
        -> Expo Audio preview begins
        -> Worker /lyrics { title, artist }
        -> LRCLIB syncedLyrics
        -> parsed timed lines
        -> SyncedLyrics(current playback time)
```

When playback changes to a different song, the provider clears the old lines, starts the new preview, and makes a new lyrics request. A delayed response for an older song must be ignored rather than replacing the new song’s lyrics.

## Error handling and constraints

- Audio playback never waits for lyric lookup.
- A missing preview URL cannot start playback and retains the app’s existing unavailable message.
- Network failure, an unmatched LRCLIB track, absent `syncedLyrics`, or invalid timestamps produce the unavailable state, not an app error.
- Seek and track changes recalculate the active line from the provider’s current playback time.
- The Worker caps and validates returned timed lines to avoid malformed or excessive responses.
- The existing Genius link behavior remains unchanged and is not treated as an in-app lyric-data source.

## Testing

- Unit-test parsing common LRC timestamps and rejecting malformed entries.
- Unit-test active-line selection at the start, between lines, after seeks, and at the preview end.
- Worker-test successful synced-lyric responses, no synced lyrics, and safe error responses.
- Hook-test that search and queue playback use the shared player state and stale lyric responses are ignored.
- Component-test loading, active-line, and unavailable lyric-panel states.
- Run the complete test suite and TypeScript check before merging.

## Scope decisions

- Timed lyrics work for both search previews and Library/playlist previews.
- The first version has no manual lyric editing, caching, full-song lyrics, or karaoke scoring.
- If a song has only non-timestamped lyrics, the first version displays the unavailable message instead of pretending they are synchronized.

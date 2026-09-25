# Playlist preview player design

## Goal

Let a Lyric Finder user play the available 30-second catalog previews in their Liked Songs or a selected playlist, without changing the existing one-song preview controls on search results.

## Scope

The player lives on the Library screen. It has two queue entry points:

- **Play liked previews** queues the saved liked songs.
- **Play playlist previews** queues the currently selected playlist.

Only songs with a `previewUrl` enter the queue. Songs without an available preview remain in the user’s library and can still open in an external music service, but they cannot play inside the app.

## User flow

1. A user opens My Library.
2. They tap Play liked previews or select a playlist and tap Play playlist previews.
3. The app filters that collection to playable previews. If none exist, it displays a message explaining why playback cannot start.
4. Otherwise, the first preview starts and a player panel appears below the collection.
5. The panel shows the current artwork, title, artist, and the queue position.
6. The user can pause/play, go to the previous or next preview, or move back/forward ten seconds. Seeking cannot move before zero or beyond the preview duration.
7. At the first or final queue item, Previous/Next stays visible but disabled as appropriate.

## Architecture

`src/lib/preview-queue.ts` will be a small pure module. It will build a queue from saved songs, derive the current queue item, and calculate a clamped seek position. This is the unit-tested boundary for filtering and navigation logic.

`src/hooks/use-playlist-preview-player.ts` will own playback state using the existing `expo-audio` package. It will hold the queue, active index, playing state, current playback time, duration, and a user-readable error. When the active queue item changes, it replaces the `expo-audio` source with that item’s preview URL. It will pause any current preview before starting the next item and will clean up playback on unmount.

`src/components/playlist-preview-player.tsx` will render the player panel and controls. It receives display state and callbacks from the hook, keeping the Library screen focused on library layout.

`src/app/explore.tsx` will create one player hook instance, wire its queue-start actions to liked songs and the selected playlist, and show the player panel.

## Error handling

- A source with no preview URL is skipped before playback begins.
- An empty playable queue produces a clear Library-screen message.
- Playback failures show a player error and leave the library usable.
- Previous/Next controls are disabled at queue boundaries.
- Seek actions are clamped to the actual duration when available.

## Compatibility

The implementation uses the already-installed `expo-audio` package and ordinary React Native controls, so it is intended to work in Expo Go on iPhone and Android. The actual audio preview availability still depends on Apple’s public catalog returning a preview URL.

## Testing

- Unit-test queue filtering so songs without previews never enter the playable queue.
- Unit-test previous/next navigation and their queue boundaries.
- Unit-test ten-second seek clamping.
- Component-test the player’s disabled boundary controls and no-preview message where practical.
- Run the full test suite and TypeScript check before merge.

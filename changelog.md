# Changelog

## Prototype 4 — Library and player upgrade

- Added persistent Favorites separate from Liked Songs. Favoriting automatically likes a song; adding a song to a playlist automatically likes it too.
- Added Play All and Shuffle for both Liked Songs and Favorites, plus repeat-all, repeat-one, shuffle, and play-once queue modes in Now Playing.
- Updated Now Playing with continuous preview-queue playback, scrolling synchronized lyrics, a yellow filled favorite indicator, and related playable song suggestions.
- The search keyboard now dismisses when the user presses Done/Search.
- In-app playback remains limited to the available 30-second public-catalog preview. Full songs open in the listener's selected music service.

## Prototype 2

- Lyrics, preview, and full listening are separate experiences.
- Likes and playlists are stored locally on the device.
- Genius cannot be opened with exact lyric lines externally highlighted.

## Initial submission

- Created the Expo React Native Lyric Finder application.
- Added the free LRCLIB and iTunes-backed Cloudflare Worker search flow.
- Added lyric validation, request timeout handling, automated tests, and Android internal-testing configuration.

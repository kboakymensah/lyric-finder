# Lyric Finder: Prototype 3 implementation plan

## Project goal

Lyric Finder helps someone identify a song from remembered lyric lines, then save it, read lyrics through Genius, and listen to an available preview. The final direction is a music-memory and discovery app with a local music library, playlists, and a practical preview player.

## What works now

- Lyric searches are sent to the project Worker and matched with Genius/LRCLIB and catalog data.
- Results show a title, artist, artwork when available, a Genius lyrics action, a listening action, and a 30-second preview when the catalog provides one.
- Songs can be saved to Liked Songs or added directly to local playlists.
- Liked Songs and selected playlists can play a queue of available 30-second previews with pause, previous, next, and ten-second seek controls.
- The player skips saved songs without a preview URL and clearly explains when a collection has no playable previews.
- The humming spike proved microphone recording and replay were feasible. It is preserved in Git history but is not part of the current app experience.

The humming spike is an audio-capture feasibility test only. It **does not identify a song from a hum**.

## Implemented feature: playlist preview queue

The Library now includes a player for Liked Songs or a selected playlist. It plays only the 30-second preview URLs supplied by the catalog API; it does not stream full commercial songs.

### Player experience

1. The user opens Liked Songs or a playlist and taps Play all.
2. The app builds a queue from songs that have a preview URL, showing a clear message if none do.
3. A player panel shows artwork, title, artist, and the queue position.
4. The controls are:
   - Play / pause
   - Next song
   - Previous song
   - Back 10 seconds / restart if near the beginning
   - Forward 10 seconds, clamped to the end of the preview
5. When a preview ends, the player advances to the next available preview in the current queue.
6. The user can return to a song result, open Genius lyrics, or open the full-song listening link without losing their saved library.

### Completed implementation

1. Added a `usePlaylistPreviewPlayer` hook with queue, active index, playback state, duration, and error state.
2. Used one reusable `expo-audio` player and replace its source when the active queue item changes.
3. Added Play all actions and the player controls to the Library screen.
4. Filtered out songs with no `previewUrl` while keeping them saved and available for external listening.
5. Added automated tests for queue filtering, navigation boundaries, seek clamping, unavailable previews, and player control boundaries.
6. Remaining release verification: test playback on physical iPhone and Android devices, then publish an EAS update after both work.

## Future research: humming-based search

The spike proved the app can handle microphone permission, capture a recording, and replay it. The next question is whether a hum can be matched accurately enough to a song catalog.

### Feasibility steps

1. Record short, consented humming clips on device.
2. Extract a simple pitch contour from the recording rather than sending raw audio to an unknown service.
3. Research a lawful melody-search or audio-analysis provider, including its pricing, privacy policy, rate limits, and API terms.
4. Compare the contour with a small test set of public-domain or permissioned melodies first.
5. Only connect it to catalog search after measuring match quality and handling false positives clearly in the UI.

### Technical and ethical pitfalls

- Recording permission can be denied; lyric search must remain fully usable without it.
- Background noise, off-key singing, tempo changes, and very short hums make melody matching unreliable.
- Full-song audio fingerprinting is not the same as melody matching and could require copyrighted reference data or a paid provider.
- Recorded audio is sensitive user data. The current spike keeps the recording on-device and does not upload it.
- iOS and Android may require different permissions and audio-session behavior; physical-device testing is required.
- A false match should never be presented as certain. Results need confidence language and a way to correct or dismiss a match.

## Success measures

For the preview player, success means a user can play an available preview queue from a playlist, pause it, move next/previous, and seek within a preview without breaking the existing lyric search or local library.

For humming, success for the next research stage means determining whether pitch-contour matching is accurate, private, affordable, and useful enough to pursue. If not, the app will keep humming as a locally recorded music-memory note while lyric search remains the identification method.

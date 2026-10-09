# Bug Fix Record

## 1. Lyrics links showed an error even when Genius had the song

- **Week / commit:** September 24, 2026 — `bf8df62`
- **Symptom:** Pressing **View Lyrics** could show the red “Genius did not have a direct lyrics page” message even though the selected song had a usable Genius page. The link sometimes opened a general search instead of the actual song page.
- **Evidence that located it:** Testing from search results showed that the app treated a missing direct link and an available Genius result the same way. Comparing the selected song’s `lyricsUrl` with the fallback logic showed that the fallback was being used too early.
- **Fix:** The lyric destination helper now uses a song’s direct Genius URL when it exists. It only displays the apology/fallback message and opens a Google lyric search when a direct Genius result is genuinely unavailable.

## 2. Library previews did not continue correctly from one song to the next

- **Week / commit:** October 2, 2026 — `353ed28`
- **Symptom:** Starting a group of previews from the library did not reliably move to the next song when a 30-second clip finished. The interface could remain on the old song instead of behaving like a music queue.
- **Evidence that located it:** Testing Play All with multiple saved songs showed that the old player state only represented one preview at a time. The queue did not receive the native player’s current track index.
- **Fix:** The shared preview-player context now uses Expo Audio’s native playlist queue and reads its status. The mini-player and Now Playing screen now follow the active queue item, which supports next/previous controls and continuous preview playback.

## 3. Shuffle kept changing the order while a library queue was playing

- **Week / commit:** October 8, 2026 — `fdf026c`
- **Symptom:** After pressing **Shuffle**, the order could reshuffle again during playback or when the library updated, so the queue felt unstable instead of playing one randomized sequence.
- **Evidence that located it:** A regression test reproduced the issue by beginning a shuffled Liked Songs queue, refreshing it with the same songs, and observing that the song order changed. This test failed before the fix.
- **Fix:** Shuffle now creates one randomized order when the listener presses it. Refreshes preserve that existing order and only append newly added playable songs, so the current song and the rest of the queue stay stable.

## Current known limitations

- In-app playback is limited to legal catalog previews, typically 30 seconds. Full playback opens the listener’s chosen music service.
- Timed lyrics can only highlight accurately when the lyric provider supplies timestamps that match the preview excerpt.

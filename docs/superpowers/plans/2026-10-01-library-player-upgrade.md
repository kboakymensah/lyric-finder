# Library and Player Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Lyric Finder's device-persistent library distinguish Liked Songs and Favorites, improve continuous 30-second preview playback, and make lyrics and suggestions easier to use.

**Architecture:** Extend the existing `LibraryData` stored in AsyncStorage with a `favoriteSongIds` array, while preserving current saved libraries through parsing defaults. Extend the shared preview-player context with queue playback modes and use the existing iTunes catalog data plus current song information to request lightweight related-song recommendations. Use scrollable views for full lyrics on search previews and Now Playing.

**Tech Stack:** Expo Router, React Native, Expo Audio, AsyncStorage, existing Cloudflare Worker/iTunes catalog, Vitest, TypeScript.

**Spec:** User-approved conversation design, 2026-10-01.

## Global Constraints

- Full-length in-app playback is unavailable from the no-cost public catalog; in-app audio remains the available 30-second preview.
- Full songs continue to open in the listener's selected external music service.
- Library, favorite, and playlist changes persist through AsyncStorage and must survive relaunch.
- Playlist additions automatically place a song in Liked Songs.
- A song can be favorited only when it is liked; favoriting it automatically likes it.

## Review Focus

- Existing stored libraries without `favoriteSongIds` restore without losing liked songs or playlists; test in Task 1.
- Removing a liked song also removes it from Favorites and existing playlists; test in Task 1.
- Repeat-one at the end of a preview restarts that same preview, while repeat-all continues at the first queue item; test in Task 2.
- Search submit via the mobile keyboard dismisses the keyboard before results render; test in Task 3.
- No timed lyrics or no catalog recommendations show a clear empty state rather than a broken player; test in Tasks 3 and 4.

### Task 1: Persisted Favorites and library membership

**Files:**
- Modify: `src/lib/library.ts`
- Modify: `src/lib/library.test.ts`
- Modify: `src/contexts/library-context.tsx`
- Modify: `src/contexts/library-context.test.tsx`

**Interfaces:**
- Produces `LibraryData.favoriteSongIds: string[]`.
- Produces `isFavorite(songId)`, `toggleFavorite(song)`, and playlist additions that ensure the song is liked.

- [ ] Write failing tests for legacy-library parsing, automatic liking, favorite toggling, and removal cleanup.
- [ ] Run `npm test -- src/lib/library.test.ts src/contexts/library-context.test.tsx` and confirm the new tests fail.
- [ ] Implement immutable favorite/library helpers and expose them through the context.
- [ ] Run the focused tests and confirm they pass.
- [ ] Commit `feat: persist favorites with liked songs`.

### Task 2: Queue modes and continuous preview playback

**Files:**
- Modify: `src/lib/preview-queue.ts`
- Modify: `src/lib/preview-queue.test.ts`
- Modify: `src/contexts/preview-player-context.tsx`
- Modify: `src/contexts/preview-player-context.test.tsx`
- Modify: `src/components/playlist-preview-player.tsx`
- Modify: `src/components/playlist-preview-player.test.tsx`

**Interfaces:**
- Produces `PlaybackMode` (`normal`, `shuffle`, `repeat-all`, `repeat-one`) and a deterministic next index helper.
- Produces player `setPlaybackMode(mode)` state and visible playback-mode controls.

- [ ] Write failing queue tests for repeat one, repeat all, and shuffled queues.
- [ ] Run the queue test file and confirm failure.
- [ ] Add queue-mode logic and connect it to the Expo Audio completion event.
- [ ] Add icon controls to Now Playing and retain accessible labels.
- [ ] Run focused player tests and confirm they pass.
- [ ] Commit `feat: add continuous preview queue modes`.

### Task 3: Library sections and keyboard dismissal

**Files:**
- Modify: `src/app/explore.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/components/song-result-card.tsx`
- Modify: relevant component/context tests

**Interfaces:**
- Consumes `isFavorite`, `toggleFavorite`, `startQueue`, and `setPlaybackMode`.
- Produces separate Liked Songs and Favorites views with Play All and Shuffle actions.

- [ ] Write a failing UI test for a yellow filled favorite action and a testable keyboard-submit handler.
- [ ] Run the focused tests and confirm failure.
- [ ] Implement Liked/Favorites sections, filled yellow favorite stars, and keyboard dismissal using React Native `Keyboard.dismiss` on submit.
- [ ] Keep the search result's 30-second preview and lyrics entry point visible.
- [ ] Run focused tests and confirm pass.
- [ ] Commit `feat: organize liked songs and favorites`.

### Task 4: Scrollable lyrics and More Like This

**Files:**
- Modify: `src/components/playlist-preview-player.tsx`
- Modify: `src/components/synced-lyrics.tsx`
- Create: `src/lib/related-songs.ts`
- Create: `src/lib/related-songs.test.ts`
- Modify: `src/contexts/preview-player-context.tsx`

**Interfaces:**
- Produces `findRelatedSongs(song, fetcher)` using iTunes artist/title search results, excluding the current song and requiring preview URLs.
- Produces a user-scrollable lyrics area in Now Playing and a More Like This section while a preview plays.

- [ ] Write failing tests for recommendation filtering and the lyrics/player empty states.
- [ ] Run focused tests and confirm failure.
- [ ] Implement free catalog recommendations and a scrollable player layout that does not prevent manual lyric scrolling.
- [ ] Run focused tests and confirm pass.
- [ ] Commit `feat: add related preview recommendations`.

### Task 5: End-to-end verification and distribution

**Files:**
- Modify: `changelog.md`

- [ ] Run `npm test`, `npm run typecheck`, and `git diff --check`.
- [ ] Update the project changelog with the verified feature set and public-catalog playback constraint.
- [ ] Merge to `main`, push to GitHub, and publish an Expo testing update after verification.

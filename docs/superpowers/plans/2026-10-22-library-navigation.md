# Library Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify Lyric Finder's search-to-library journey through focused collection views while preserving saved music, playlists, playback, and lyrics.

**Architecture:** Keep `src/app/explore.tsx` as My Library and add local view state for the library landing, Liked Songs, Favorites, Playlists, and a selected playlist. Search result cards are reordered visually without changing their callbacks.

**Tech Stack:** Expo Router, React Native, Expo Image, React Context, AsyncStorage, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-22-library-navigation-design.md`

## Global Constraints

- Preserve current AsyncStorage schemas and existing Expo SDK 58 dependencies.
- Use Lyric Finder's charcoal, cream, and gold palette; no Apple branding or assets.
- Keep licensed 30-second previews as the only in-app audio source.
- Every interactive control keeps a descriptive accessibility label.

## Review Focus

- Empty collections explain the correct next action.
- Songs without a preview keep the existing unavailable message.
- Library changes appear immediately in Liked Songs and Favorites.
- Playlist editing is hidden until a playlist is selected.
- Result actions retain lyrics, preview, listening, save, and playlist behavior.

---

### Task 1: Action-first result card layout

**Files:**
- Modify: `src/components/song-result-card.tsx`
- Test: `src/components/song-result-card.test.tsx`

**Interfaces:**
- Consumes: existing `SongResultCardProps` callbacks.
- Produces: unchanged callback interface with primary action ordering represented in the rendered card.

- [ ] Write a failing render test asserting `View Lyrics`, `Play 30-second Preview`, and `Listen on…` precede `Add to Playlist`.
- [ ] Run `npm test -- src/components/song-result-card.test.tsx`; expect the ordering assertion to fail.
- [ ] Reorder visible action groups without changing callbacks or picker behavior.
- [ ] Run the focused test again; expect PASS.
- [ ] Commit as `feat: prioritize song result actions`.

### Task 2: Focused library collection views

**Files:**
- Modify: `src/app/explore.tsx`
- Test: `src/app/explore.test.tsx`

**Interfaces:**
- Consumes: current `useLibrary()` and `usePreviewPlayer()` interfaces.
- Produces: `home | liked | favorites | playlists | playlist` view state.

- [ ] Write failing tests that assert the landing view has Liked Songs, Favorites, and Playlists; selecting one shows only its focused heading and empty-state guidance.
- [ ] Run `npm test -- src/app/explore.test.tsx`; expect FAIL because focused navigation does not yet exist.
- [ ] Implement a My Library landing screen with collection counts and compact Recently Played; move Liked/Favorites/playlist content behind its focused view.
- [ ] Run focused tests; expect PASS.
- [ ] Commit as `feat: simplify library collections`.

### Task 3: Collection playback and playlist isolation

**Files:**
- Modify: `src/app/explore.tsx`
- Test: `src/app/explore.test.tsx`

**Interfaces:**
- Consumes: existing player `startSong`, `startLibraryQueue`, `startQueue`, and playlist APIs.
- Produces: focused collection controls and isolated selected-playlist management.

- [ ] Write failing tests for Play all/Shuffle, song-row preview start, and absence of rename/delete controls until a playlist is selected.
- [ ] Run the focused test and confirm it fails.
- [ ] Use existing queue behavior in focused Liked/Favorites views; keep create/listing in Playlists and show rename/delete/membership controls only for a selected playlist.
- [ ] Run focused tests and confirm they pass.
- [ ] Commit as `feat: focus library playback controls`.

### Task 4: Discoverable library entry point

**Files:**
- Modify: `src/app/index.tsx`
- Test: `src/app/index.test.tsx`

**Interfaces:**
- Consumes: Expo Router `Link` and current search behavior.
- Produces: a visually promoted My Library entry to `/explore`.

- [ ] Write a failing home-screen test for a My Library link while keeping Find my song and keyboard submit.
- [ ] Run `npm test -- src/app/index.test.tsx`; expect FAIL.
- [ ] Add the compact My Library header link and remove duplicated primary navigation.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat: add clear library navigation`.

### Task 5: Full verification and Expo testing update

**Files:**
- Verify: all modified files

- [ ] Run `npm run typecheck && npm test && npx expo-doctor`; expect exit 0, passing tests, and 20/20 Expo Doctor checks.
- [ ] Start `npx expo start --clear --tunnel` and test search, result actions, library collections, playback, and back navigation in SDK 58 Expo Go.
- [ ] Commit the design documentation and plan, then push the `upgrade/sdk-58` branch.

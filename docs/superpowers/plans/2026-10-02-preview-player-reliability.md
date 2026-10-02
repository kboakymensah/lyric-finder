# Preview Player Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore previews for safely matched catalog recordings and make the in-app preview player behave as a reliable, persistent queue player.

**Architecture:** The Worker keeps iTunes as its first catalog provider and queries Deezer only for a missing preview; contributor-aware verification prevents a same-title but different-artist recording from being used. The React Native app replaces hand-managed end-of-track handling with Expo Audio's native playlist and presents one player surface above all routes, where mini-player controls and full Now Playing navigation have separate press targets.

**Tech Stack:** Expo Router, React Native, Expo Audio 57.0.4, Hono/Cloudflare Worker, iTunes Search API, Deezer public API, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-02-preview-player-reliability-design.md`

## Global Constraints

- Keep Expo/React Native plus Cloudflare Worker architecture.
- Use no API keys or paid catalog accounts.
- Use iTunes first and Deezer only after iTunes has no safe preview match.
- Accept a Deezer fallback only when normalized titles match and its contributors include the requested artist.
- Keep in-app playback to catalog-supplied 30-second previews; full playback stays external.
- Do not present full-track LRCLIB lyric timestamps as synchronized to an excerpt with unknown offset.

## Review Focus

- A same-title Deezer track without the requested artist contributor must remain unavailable (Task 1).
- A Deezer result with matching contributor data but no preview URL must not be treated as playable (Task 1).
- A search-result one-song preview must not accidentally inherit the previous library queue (Task 2).
- A mini-player play/pause press must not open the Now Playing modal (Task 3).
- A preview with unknown excerpt offset must show lyrics without an active-line highlight (Task 4).

### Task 1: Add verified Deezer catalog fallback

**Files:**
- Modify: `worker/src/search.ts`
- Test: `worker/test/search.test.ts`

**Interfaces:**
- Produces: `enrichWithCatalog(trackName: string, artistName: string, fetcher: Fetcher): Promise<CatalogTrack | undefined>` returning iTunes data first or verified Deezer data shaped as the existing catalog fields.
- Consumes: current Worker `searchSongs` result mapping.

- [ ] **Step 1: Write failing Worker tests for a verified Deezer preview and rejected same-title result**

Add one `searchSongs` test where iTunes returns no results and Deezer's track detail has normalized title `Hellcats & Trackhawks`, a Lil Durk contributor, and a preview URL; expect that URL and link in the result. Add one test with the same title but contributors excluding Lil Durk; expect `previewUrl: null`.

- [ ] **Step 2: Run Worker tests to verify they fail**

Run: `npm test -- --run worker/test/search.test.ts`

Expected: FAIL because no Deezer fallback exists.

- [ ] **Step 3: Implement `enrichWithCatalog` in `worker/src/search.ts`**

Try the existing iTunes match first. If it lacks a preview, query Deezer search, retrieve the candidate track detail for contributor credits, and return it only when the normalized title matches and a contributor name matches the requested artist. Preserve existing iTunes artwork/link values when present.

- [ ] **Step 4: Run Worker tests to verify they pass**

Run: `npm test -- --run worker/test/search.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the Worker catalog fallback**

```bash
git add worker/src/search.ts worker/test/search.test.ts
git commit -m "feat: add verified preview catalog fallback"
```

### Task 2: Use Expo's native playlist for preview queues

**Files:**
- Modify: `src/contexts/preview-player-context.tsx`
- Test: `src/contexts/preview-player-context.test.tsx`

**Interfaces:**
- Produces: the existing `usePreviewPlayer()` public functions with native playlist-backed `currentSong`, `currentIndex`, `isPlaying`, `next`, `previous`, `seekBy`, and queue modes.
- Consumes: `useAudioPlaylist`, `useAudioPlaylistStatus`, `PlaybackMode`, saved-song preview URLs.

- [ ] **Step 1: Write failing context tests for playlist index advancement and one-song isolation**

Mock Expo's playlist status. Verify a completed native queue reports the new queue song through `currentSong`, and verify `startSong(song)` replaces a library queue with only that song.

- [ ] **Step 2: Run the context test to verify it fails**

Run: `npm test -- --run src/contexts/preview-player-context.test.tsx`

Expected: FAIL because the provider uses a single `useAudioPlayer` and manual advancement.

- [ ] **Step 3: Replace manual advance handling with `useAudioPlaylist`**

Build the native source list from the active queue, map native status `currentIndex` to the corresponding song, map normal/repeat/shuffle modes to native playlist operation, and call native `play`, `next`, `previous`, and `seekTo`. Start a one-song source list for result-card previews and a multi-song list for Play All/Shuffle. Remove hand-managed `didJustFinish` advancement.

- [ ] **Step 4: Run the context test to verify it passes**

Run: `npm test -- --run src/contexts/preview-player-context.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit native playlist playback**

```bash
git add src/contexts/preview-player-context.tsx src/contexts/preview-player-context.test.tsx
git commit -m "fix: use native preview queues"
```

### Task 3: Make the mini player persistent and give controls separate actions

**Files:**
- Create: `src/components/preview-player-surface.tsx`
- Modify: `src/components/playlist-preview-player.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/app/explore.tsx`
- Test: `src/components/preview-player-surface.test.tsx`

**Interfaces:**
- Produces: `PreviewPlayerSurface`, rendered once in the root layout and reading `usePreviewPlayer()` plus `useLibrary()`.
- Consumes: `PlaylistPreviewPlayer` as the full-screen modal view and existing player/context callbacks.

- [ ] **Step 1: Write a failing surface test for separate mini-player press targets**

Render a current song and assert that pressing the artwork/title control opens the modal while pressing Play calls the playback toggle without changing modal visibility; assert previous and next invoke their callbacks.

- [ ] **Step 2: Run the surface test to verify it fails**

Run: `npm test -- --run src/components/preview-player-surface.test.tsx`

Expected: FAIL because the current full mini player is a single press target embedded in each route.

- [ ] **Step 3: Implement root-level `PreviewPlayerSurface`**

Render it after the router stack in `_layout.tsx` so it remains above route scroll content. Split the mini bar into an information press target that opens Now Playing and dedicated previous, play/pause, and next buttons. Remove automatic modal opening on every song change. Keep the full modal's seek, mode, favorite, and related-song controls.

- [ ] **Step 4: Remove duplicate route-local player surfaces**

Pass no player surface props from `index.tsx` and `explore.tsx`; these routes retain only search and library controls. Ensure the root surface includes favorite callbacks through `LibraryProvider`.

- [ ] **Step 5: Run component tests to verify the player surface passes**

Run: `npm test -- --run src/components/preview-player-surface.test.tsx src/components/playlist-preview-player.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the persistent mini player**

```bash
git add src/components/preview-player-surface.tsx src/components/preview-player-surface.test.tsx src/components/playlist-preview-player.tsx src/app/_layout.tsx src/app/index.tsx src/app/explore.tsx
git commit -m "feat: add persistent preview controls"
```

### Task 4: Prevent misleading lyric synchronization

**Files:**
- Modify: `src/components/synced-lyrics.tsx`
- Modify: `src/components/playlist-preview-player.tsx`
- Test: `src/components/synced-lyrics.test.tsx`

**Interfaces:**
- Produces: `SyncedLyrics` support for `canHighlight?: boolean` and an unsynchronized-preview explanation.
- Consumes: existing `TimedLyricLine[]` and player elapsed seconds.

- [ ] **Step 1: Write a failing lyric component test for an unknown preview offset**

Render timestamped lines with `canHighlight={false}` and a nonzero current time. Assert no line receives the active style and the user sees an explanation that the excerpt cannot be line-synced.

- [ ] **Step 2: Run lyric component test to verify it fails**

Run: `npm test -- --run src/components/synced-lyrics.test.tsx`

Expected: FAIL because the component always derives an active line from the full-recording timestamp.

- [ ] **Step 3: Implement the honest preview lyric state**

Add the optional highlight flag. For third-party preview excerpts with no reliable offset, do not calculate or auto-scroll an active line; show the lyric text and a compact explanation in the Now Playing view.

- [ ] **Step 4: Run lyric component tests to verify they pass**

Run: `npm test -- --run src/components/synced-lyrics.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the lyric timing correction**

```bash
git add src/components/synced-lyrics.tsx src/components/synced-lyrics.test.tsx src/components/playlist-preview-player.tsx
git commit -m "fix: clarify preview lyric timing"
```

### Task 5: Verify and publish

**Files:**
- Modify: `changelog.md`

- [ ] **Step 1: Add an honest changelog entry**

Document Deezer fallback previews, native queue progression, persistent player controls, and the limitation of excerpt lyric timing.

- [ ] **Step 2: Run full verification**

Run: `git diff --check && npm test && npm run typecheck`

Expected: all tests pass, TypeScript exits successfully, and no whitespace errors are reported.

- [ ] **Step 3: Deploy the Worker and publish the Expo testing update**

Run:

```bash
npx wrangler deploy --config worker/wrangler.jsonc
npx eas-cli@latest update --branch testing --environment preview --message "Improve preview playback reliability"
npx eas-cli@latest update:list --branch testing --limit 1 --json
```

- [ ] **Step 4: Commit verification documentation and push main**

```bash
git add changelog.md
git commit -m "docs: record preview player improvements"
git push origin main
```

## Self-Review

- Catalog fallback, safe recording validation, persistent player controls, automatic advancement, and lyric-timing honesty each have a dedicated task.
- The plan keeps 30-second preview limits and excludes misleading or incorrectly attributed audio.
- Each review-focus condition is pinned to an owning task's test.
- No user-account, paid API, or unrelated UI work is included.

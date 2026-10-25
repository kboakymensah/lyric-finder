# Lyric Finder Figma Make UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing native Lyric Finder app closely follow the approved Figma Make music-discovery prototype, while preserving the real lyric-search, library, playlist, and preview behavior.

**Architecture:** Keep Expo Router and the current `LibraryProvider` / `PreviewPlayerProvider` as the sources of truth. Add a small in-memory selected-song context for a native Song Details route, then compose the redesigned screens from reusable native music UI primitives. Search results, saved songs, favorites, playlists, and recently played items continue to use existing real data and existing persistence.

**Tech Stack:** React Native 0.88, Expo SDK 58, Expo Router, TypeScript, `expo-image`, `expo-linking`, AsyncStorage, Vitest, React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-25-figma-make-ui-design.md`

## Global Constraints

- Preserve the Cloudflare Worker request flow, `EXPO_PUBLIC_API_BASE_URL`, LRCLIB/iTunes enrichment, timeout handling, loading states, and errors.
- Use only native React Native components and existing dependencies. Do not copy the Figma web export or add Apple branding/assets.
- Never show invented titles, artists, lyrics, or artwork as if they are search results. Use a native music fallback only when real artwork is missing.
- Keep the existing AsyncStorage library and recent-search schemas compatible. Do not place test files under `src/app/`, because Expo Router treats them as routes.
- Keep the bottom navigation and preview surface above content without covering scrollable controls or safe areas.

## Review Focus

1. A fresh install has truthful empty states rather than prototype demo data.
2. A selected search result and a selected saved song both open native Song Details; a direct/expired details route fails safely.
3. Save, favorite, playlist membership, and preview actions update the existing contexts immediately and are visible on every relevant screen.
4. Unavailable lyrics and excerpts are labelled accurately; the external lyrics destination remains available.
5. Screen content remains reachable above the persistent mini player, tab bar, and device safe area.

---

## Task 1: Establish reusable visual primitives and safe shared shell

**Files:**
- Create: `src/components/music-ui.tsx`
- Create: `src/components/music-ui.test.tsx`
- Modify: `src/components/app-bottom-nav.tsx`
- Modify: `src/components/preview-player-surface.tsx`
- Modify: `src/global.css` only if the existing web fallback needs matching tokens

- [ ] **Step 1: Write focused component tests first.** Cover artwork fallback accessibility text, a compact song row press callback, and a screen-content bottom inset supplied by the shared shell.
- [ ] **Step 2: Run the new test file and confirm it fails** because the native primitives do not exist yet.
- [ ] **Step 3: Implement native primitives.** Add shared palette/spacing/type tokens plus `ScreenContainer`, gold eyebrow label, artwork tile with native music fallback, compact song row, horizontal media card, section header, empty state, and primary gold button. Keep presentation-only components data-agnostic.
- [ ] **Step 4: Adjust the existing tab bar and mini player.** Retain their routes and playback behavior, but align their charcoal/gold visual treatment and expose a consistent content-bottom spacing value so screen scroll views can reserve room for both fixed surfaces and safe area.
- [ ] **Step 5: Run component tests and typecheck.**
- [ ] **Step 6: Commit.** `feat: add Figma-inspired music UI primitives`

## Task 2: Recompose Search around the prototype while retaining live search

**Files:**
- Modify: `src/app/index.tsx`
- Modify: `src/components/song-results.tsx`
- Modify: `src/components/song-result-card.tsx`
- Modify: `src/components/song-result-card.test.tsx`
- Create: `src/__tests__/search-screen.test.tsx`

- [ ] **Step 1: Write/extend tests first.** Verify the 180-character input limit, visible input label/helper/counter, a recent-search row repopulating the input, preserved search/empty/error states, and result-card detail navigation callback.
- [ ] **Step 2: Run these tests and confirm the new visual/interaction expectations fail.**
- [ ] **Step 3: Rebuild the search composition.** Add the Lyric Finder brand row, the approved prompt/supporting copy, labelled multiline field, helper/counter, full-width `Find my song` control, and compact selectable/removable recent-search rows. Preserve current submit validation, API calls, abort/timeout logic, loading indicator, and results data.
- [ ] **Step 4: Make real search results music-like rather than replacing them.** Use real artwork/title/artist/snippet, retain Lyrics, Preview, Listen, Save/Favorite, and Playlist actions, and make the title/artwork or an explicit detail affordance open Song Details. Keep preview-unavailable behavior explicit.
- [ ] **Step 5: Run targeted tests, full tests, and typecheck.**
- [ ] **Step 6: Commit.** `feat: redesign lyric search flow`

## Task 3: Add a native Song Details route tied to the existing app state

**Files:**
- Create: `src/contexts/song-details-context.tsx`
- Create: `src/contexts/song-details-context.test.tsx`
- Create: `src/app/song.tsx`
- Create: `src/__tests__/song-screen.test.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/components/song-results.tsx`
- Modify: `src/components/song-result-card.tsx`

- [ ] **Step 1: Write tests first.** Cover opening/clearing the selected in-memory song, a safe unavailable state when no song was selected, and Favorite, Save, Playlist, preview, and external lyrics affordances rendered from real selected song data.
- [ ] **Step 2: Run the tests and confirm they fail before implementation.**
- [ ] **Step 3: Implement `SongDetailsProvider`.** Store only the currently selected `SongResult` or saved-song-compatible record for the in-session Expo route; do not serialize API credentials or fabricate data. Mount it in the existing provider hierarchy.
- [ ] **Step 4: Implement `src/app/song.tsx`.** Build the native detail screen: back action, artwork/fallback, title/artist, Favorite / Saved / Playlist controls, truthful lyric excerpt or unavailable status, external lyrics action, and preview action that invokes the existing preview player. If the route has no selected song, render a clear return-to-search state instead of crashing.
- [ ] **Step 5: Wire result cards into the route.** Keep existing action handlers intact, but route the card's details affordance through the selected-song context and Expo Router.
- [ ] **Step 6: Run targeted tests, full tests, and typecheck.**
- [ ] **Step 7: Commit.** `feat: add native song details screen`

## Task 4: Rebuild Library, Favorites, and Playlists as real collections

**Files:**
- Modify: `src/app/explore.tsx`
- Modify: `src/app/favorites.tsx`
- Modify: `src/app/playlists.tsx`
- Modify: `src/__tests__/explore.test.tsx`
- Modify: `src/contexts/library-context.test.tsx` only if new behavior needs coverage
- Modify: `src/lib/library.test.ts` only if a genuine data-layer bug is exposed

- [ ] **Step 1: Write/extend tests first.** Cover a fresh empty library, real recently played card visibility, compact saved/favorite rows, playlist grid fallback artwork, valid playlist creation through the modal, and a song row opening Song Details.
- [ ] **Step 2: Run the tests and confirm new collection-layout expectations fail.**
- [ ] **Step 3: Refactor `LibraryScreen` using the shared primitives.** Preserve its existing route entry points and context operations, but compose: My Library with conditional recently-found feature card based solely on a real recently played song, horizontal real recently played cards, and saved-song rows.
- [ ] **Step 4: Rebuild Favorites.** Add a summary/play-all header when favorites exist, accurate compact song rows, and a useful empty state when none exist. Continue using the existing favorite list and preview integration.
- [ ] **Step 5: Rebuild Playlists.** Render the two-column card grid, use the first real playlist song artwork when available, and a native gold music fallback otherwise. Replace inline creation with a native `Modal` bottom-sheet equivalent that has dismiss, name validation, and disabled-until-valid create behavior. Preserve rename, delete, add/remove, and preview actions in playlist detail.
- [ ] **Step 6: Wire collection song presses through the Song Details context while keeping preview controls usable.**
- [ ] **Step 7: Run targeted tests, full tests, and typecheck.**
- [ ] **Step 8: Commit.** `feat: redesign music collections`

## Task 5: Verify the complete native experience and production bundle

**Files:**
- Modify only files required to fix verification failures from tasks 1–4.

- [ ] **Step 1: Run `npm test`.** Confirm all unit and component tests pass.
- [ ] **Step 2: Run `npm run typecheck`.** Fix type errors without loosening TypeScript or hiding errors.
- [ ] **Step 3: Run `git diff --check`.** Resolve whitespace errors.
- [ ] **Step 4: Run `npx expo export --platform ios`.** Confirm the native route tree—including the new Song Details route—bundles successfully.
- [ ] **Step 5: Manually exercise in Expo Go.** Check lyric search (including loading/error), recent-search reuse, Song Details, save/favorite synchronization, playlist create/add/remove, tab navigation, mini player, and safe-area scrolling.
- [ ] **Step 6: Commit any verification fixes.** `fix: polish Figma-inspired mobile flow`
- [ ] **Step 7: Report exact files changed, commands run, results, and any remaining limitation.**

# Prototype 2 Library and Result Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add separate lyrics, preview, listening, saving, and local-playlist capabilities to Lyric Finder.

**Architecture:** Extend the song API with a dedicated `lyricsUrl`. Keep all library transformations pure in one module, persist them through one AsyncStorage-backed context, and have result cards receive explicit callbacks rather than deciding external navigation themselves.

**Tech Stack:** Expo Router, React Native, TypeScript, AsyncStorage, Expo Audio, Hono, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-prototype-2-library-and-actions-design.md`

## Global Constraints

- Keep the existing Expo/React Native and Cloudflare Worker architecture.
- Do not introduce a paid service, account, or secret.
- Keep Genius lyric search and iTunes metadata/preview enrichment.
- Library data is device-local only.
- Preserve black-and-yellow styling.
- Do not modify the existing uncommitted EAS/app configuration files.

---

## File Structure

- `src/types/song.ts`: song, saved-song, and response types.
- `src/lib/library.ts`: pure data parsing and liked-song/playlist operations.
- `src/lib/library.test.ts`: unit tests for library transitions.
- `src/contexts/library-context.tsx`: device persistence and shared library state.
- `src/app/_layout.tsx`: provider setup.
- `src/app/index.tsx`: search result actions and Library route.
- `src/app/explore.tsx`: local Library screen.
- `src/components/song-result-card.tsx` and `song-results.tsx`: explicit action UI.
- `__tests__/song-result-card.test.tsx`: action behavior tests.
- `worker/src/search.ts` and `worker/test/search.test.ts`: lyrics URL contract.
- `package.json`, `package-lock.json`: AsyncStorage dependency.

### Task 1: Separate lyrics and full-listening URLs

**Files:**
- Modify: `src/types/song.ts`
- Modify: `worker/src/search.ts`
- Modify: `worker/test/search.test.ts`

**Interfaces:**
- Produces: `SongResult.lyricsUrl: string | null`.
- Produces: `SavedSong = Pick<SongResult, 'id' | 'title' | 'artist' | 'artworkUrl' | 'lyricsUrl' | 'previewUrl' | 'listenUrl'>`.

- [ ] **Step 1: Write the failing Worker test**

In the current Genius test in `worker/test/search.test.ts`, assert:

```ts
expect(results[0]).toMatchObject({
  title: 'Hello',
  lyricsUrl: 'https://genius.com/Adele-hello-lyrics',
  listenUrl: 'https://music.apple.com/example',
});
```

In the LRCLIB fallback test assert `expect(results[0].lyricsUrl).toBeNull()`.

- [ ] **Step 2: Run focused test**

Run: `npm test -- worker/test/search.test.ts`

Expected: FAIL because `lyricsUrl` is absent.

- [ ] **Step 3: Implement the minimum contract**

Add `lyricsUrl: string | null` to `SongResult` and export `SavedSong`. In `searchSongs`, map a Genius hit to `lyricsUrl: match.url ?? null`; map an LRCLIB hit to `lyricsUrl: null`. Retain iTunes-first `listenUrl` behavior.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- worker/test/search.test.ts && npm run typecheck`

```bash
git add src/types/song.ts worker/src/search.ts worker/test/search.test.ts
git commit -m "feat: separate lyrics and listening links"
```

### Task 2: Build testable local-library operations

**Files:**
- Create: `src/lib/library.ts`
- Create: `src/lib/library.test.ts`

**Interfaces:**
- Produces: `Playlist`, `LibraryData`, `emptyLibrary`, `parseLibrary`, `toSavedSong`, `toggleLikedSong`, `createPlaylist`, `deletePlaylist`, `addSongToPlaylist`, `removeSongFromPlaylist`.

- [ ] **Step 1: Write failing state-transition tests**

Create `src/lib/library.test.ts` with a `SavedSong` fixture and these test cases:

```ts
it('adds then removes a liked song without duplicates', () => {
  const liked = toggleLikedSong(emptyLibrary, song);
  expect(liked.likedSongs).toEqual([song]);
  expect(toggleLikedSong(liked, song).likedSongs).toEqual([]);
});

it('creates one trimmed playlist and rejects blank or duplicate names', () => {
  const next = createPlaylist(emptyLibrary, ' Road Trip ');
  expect(next.playlists).toHaveLength(1);
  expect(createPlaylist(next, 'road trip').playlists).toHaveLength(1);
  expect(createPlaylist(next, '   ').playlists).toHaveLength(1);
});

it('adds a liked song once, removes it, deletes a playlist, and rejects corrupt JSON', () => {
  const liked = toggleLikedSong(emptyLibrary, song);
  const withPlaylist = createPlaylist(liked, 'Road Trip');
  const id = withPlaylist.playlists[0].id;
  expect(addSongToPlaylist(withPlaylist, id, song.id).playlists[0].songIds).toEqual([song.id]);
  expect(parseLibrary('{bad json}')).toEqual(emptyLibrary);
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- src/lib/library.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement immutable data operations**

Export:

```ts
export type Playlist = { id: string; name: string; songIds: string[] };
export type LibraryData = { likedSongs: SavedSong[]; playlists: Playlist[] };
export const emptyLibrary: LibraryData = { likedSongs: [], playlists: [] };
```

All operations return new data. Playlist creation trims names and compares case-insensitively. A song may be added only if liked and may occur once per playlist. Invalid stored data returns `emptyLibrary`; JSON parsing is wrapped in `try/catch`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/lib/library.test.ts && npm run typecheck`

```bash
git add src/lib/library.ts src/lib/library.test.ts
git commit -m "feat: add local library data model"
```

### Task 3: Persist and share the library

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/contexts/library-context.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Produces: `LibraryProvider` and `useLibrary()` returning `data`, `status`, `error`, `isLiked`, `toggleSong`, `create`, `removePlaylist`, `addToPlaylist`, and `removeFromPlaylist`.

- [ ] **Step 1: Install compatible device storage**

Run:

```bash
npx expo install @react-native-async-storage/async-storage
```

Expected: dependency appears in both package files.

- [ ] **Step 2: Implement resilient provider**

Use storage key `@lyric-finder/library-v1`. On mount, load and parse storage; status progresses from `'loading'` to `'ready'`. A read failure starts an empty library and reports `Your saved library could not be loaded.` Each mutation updates React immediately, writes JSON to storage, and reports `Your library changed, but it could not be saved on this device.` if writing fails. `useLibrary()` must throw outside its provider.

- [ ] **Step 3: Register provider**

Wrap the `Stack` in `src/app/_layout.tsx` with `LibraryProvider`.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm test`

```bash
git add package.json package-lock.json src/contexts/library-context.tsx src/app/_layout.tsx
git commit -m "feat: persist liked songs and playlists locally"
```

### Task 4: Clarify result controls

**Files:**
- Modify: `src/components/song-result-card.tsx`
- Modify: `src/components/song-results.tsx`
- Modify: `__tests__/song-result-card.test.tsx`

**Interfaces:**
- Consumes: `isSaved`, `onViewLyrics(song)`, `onListen(song)`, and `onToggleSaved(song)`.
- Produces: labeled View Lyrics, Play Preview/Pause, Listen, and Save/Remove controls.

- [ ] **Step 1: Write failing card tests**

Add `lyricsUrl` to the existing fixture. Test these controls individually:

```tsx
act(() => card.root.findByProps({ accessibilityLabel: 'View lyrics for Hello' }).props.onPress());
act(() => card.root.findByProps({ accessibilityLabel: 'Listen to Hello' }).props.onPress());
act(() => card.root.findByProps({ accessibilityLabel: 'Save Hello' }).props.onPress());
expect(onViewLyrics).toHaveBeenCalledWith(song);
expect(onListen).toHaveBeenCalledWith(song);
expect(onToggleSaved).toHaveBeenCalledWith(song);
```

Also test that null `lyricsUrl` hides View Lyrics and `isSaved: true` renders `Remove Hello from liked songs`.

- [ ] **Step 2: Run the failing test**

Run: `npm test -- __tests__/song-result-card.test.tsx`

Expected: FAIL because the props and controls do not exist.

- [ ] **Step 3: Implement presentational controls**

Remove direct `Linking` use from the card. Render View Lyrics only with a URL, Preview/Pause only with a preview, then Listen, then Save/Remove. Give each explicit accessibility labels. Pass saved state and callbacks through `SongResults` to best and alternative cards.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- __tests__/song-result-card.test.tsx && npm run typecheck`

```bash
git add src/components/song-result-card.tsx src/components/song-results.tsx __tests__/song-result-card.test.tsx
git commit -m "feat: clarify result actions and save songs"
```

### Task 5: Connect Home and build Library

**Files:**
- Modify: `src/app/index.tsx`
- Modify: `src/app/explore.tsx`

**Interfaces:**
- Consumes: `useLibrary()`, external-result callbacks, and result-card props.
- Produces: a route to Library and a local playlist editing screen.

- [ ] **Step 1: Wire Home callbacks**

Use `Link` from Expo Router and `Linking` from React Native. Add an `openExternal(url, unavailableMessage)` helper that checks `Linking.canOpenURL`, opens the URL, and sets the supplied message on any failure. Pass lyrics, listen, and save callbacks to `SongResults`. Add a link labeled **Open my library** to `/explore`. Display a library storage error beneath the current message.

- [ ] **Step 2: Replace the starter screen**

Rewrite `src/app/explore.tsx` as **My Library** in black/yellow. Include: back-to-search link; empty liked-song guidance; each saved song with cover fallback, title, artist, and Remove; new playlist input and Create playlist; playlist selection and Delete playlist; add each uncontained liked song to the selection; remove each selected-playlist song. Use local `selectedPlaylistId` and `newPlaylistName`; clear selection when it is deleted.

- [ ] **Step 3: Verify on device**

Run: `npm run typecheck && npm test`

Run: `npx expo start --clear`

Verify lyric search, Genius View Lyrics, in-app preview where offered, Listen handoff, saving, a named playlist, membership removal, and persistence after force-closing/reopening the app.

- [ ] **Step 4: Commit screens**

```bash
git add src/app/index.tsx src/app/explore.tsx
git commit -m "feat: add local song library screen"
```

### Task 6: Final verification and documentation

**Files:**
- Modify: `changelog.md`

- [ ] **Step 1: Add an honest Prototype 2 changelog entry**

State that lyrics, preview, and full listening are separate; likes/playlists are local; Genius cannot be opened with exact lines externally highlighted.

- [ ] **Step 2: Run final checks**

```bash
npm test
npm run typecheck
git diff --check
git status --short
git ls-files .env .env.local
```

Expected: tests and types pass, no whitespace failures, only intended changes remain, and no environment file is tracked.

- [ ] **Step 3: Commit final documentation**

```bash
git add changelog.md
git commit -m "docs: record Prototype 2 library update"
git log --oneline -8
```


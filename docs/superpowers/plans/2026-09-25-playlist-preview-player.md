# Playlist Preview Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-library queue player for the available 30-second previews in Liked Songs and selected playlists.

**Architecture:** Keep queue calculations in a pure `preview-queue` library so filtering, navigation, and seek boundaries can be tested without audio. A `usePlaylistPreviewPlayer` hook will combine that queue with the already-installed `expo-audio` player. The Library screen starts queues and renders a focused player panel component.

**Tech Stack:** Expo Router, React Native, TypeScript, `expo-audio`, `expo-image`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-25-playlist-preview-player-design.md`

## Global Constraints

- Use the already-installed `expo-audio` package; do not add a paid service or a new account.
- Preserve the existing individual result-card preview behavior.
- The library player supports only `SavedSong` records with a non-empty `previewUrl`.
- Keep the black/yellow Lyric Finder visual system and accessibility labels.
- Work in Expo Go on iOS and Android when the public catalog provides a preview URL.

## Review Focus

- Empty Liked Songs and empty playlists must show a no-preview message instead of an empty player; cover in Task 1 queue tests.
- Saved songs with missing `previewUrl` must be skipped, not crash audio playback; cover in Task 1 queue tests.
- Navigation cannot leave the queue at `-1` or past its final item; cover in Task 1 boundary tests.
- Seeking cannot be negative or beyond a known duration; cover in Task 1 seek-clamping tests.
- A playback source failure must keep the Library screen usable and show a readable player error; cover in Task 2 hook behavior and Task 3 component rendering.

### Task 1: Create pure preview queue helpers

**Files:**
- Create: `src/lib/preview-queue.ts`
- Create: `src/lib/preview-queue.test.ts`

**Interfaces:**
- Consumes: `SavedSong` from `src/types/song.ts`.
- Produces: `buildPreviewQueue(songs: SavedSong[]): SavedSong[]`, `nextQueueIndex(index: number, queueLength: number): number`, `previousQueueIndex(index: number): number`, and `clampPreviewSeek(positionSeconds: number, durationSeconds: number): number`.

- [ ] **Step 1: Write the failing tests**

```ts
it('keeps only saved songs with preview URLs in a queue', () => {
  expect(buildPreviewQueue([playableSong, unavailableSong])).toEqual([playableSong]);
});

it('does not move beyond queue boundaries', () => {
  expect(previousQueueIndex(0)).toBe(0);
  expect(nextQueueIndex(2, 3)).toBe(2);
});

it('clamps seek positions within a known preview duration', () => {
  expect(clampPreviewSeek(-10, 30)).toBe(0);
  expect(clampPreviewSeek(45, 30)).toBe(30);
});
```

- [ ] **Step 2: Run the tests to verify the RED state**

Run: `npx vitest run src/lib/preview-queue.test.ts`

Expected: FAIL because `./preview-queue` does not exist.

- [ ] **Step 3: Write the minimal pure implementation**

```ts
export function buildPreviewQueue(songs: SavedSong[]) {
  return songs.filter((song) => Boolean(song.previewUrl));
}

export function nextQueueIndex(index: number, queueLength: number) {
  return Math.min(index + 1, Math.max(queueLength - 1, 0));
}

export function previousQueueIndex(index: number) {
  return Math.max(index - 1, 0);
}

export function clampPreviewSeek(positionSeconds: number, durationSeconds: number) {
  return Math.max(0, Math.min(positionSeconds, durationSeconds));
}
```

- [ ] **Step 4: Run the queue tests to verify GREEN**

Run: `npx vitest run src/lib/preview-queue.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the queue foundation**

```bash
git add src/lib/preview-queue.ts src/lib/preview-queue.test.ts
git commit -m "feat: add preview queue helpers"
```

### Task 2: Add the playback queue hook

**Files:**
- Create: `src/hooks/use-playlist-preview-player.ts`
- Modify: `src/lib/preview-queue.test.ts`

**Interfaces:**
- Consumes: queue helpers from `src/lib/preview-queue.ts` and `useAudioPlayer` from `expo-audio`.
- Produces: `usePlaylistPreviewPlayer()` with `queue`, `currentSong`, `currentIndex`, `isPlaying`, `message`, `start(songs)`, `toggle()`, `next()`, `previous()`, `seekBy(deltaSeconds)`, `canNext`, and `canPrevious`.

- [ ] **Step 1: Extend the failing tests for hook dependencies**

```ts
it('returns an empty queue when every saved song lacks a preview', () => {
  expect(buildPreviewQueue([unavailableSong])).toEqual([]);
});

it('moves from the second queue item back to the first', () => {
  expect(previousQueueIndex(1)).toBe(0);
});
```

- [ ] **Step 2: Run the focused tests before hook implementation**

Run: `npx vitest run src/lib/preview-queue.test.ts`

Expected: PASS for the already-implemented queue contract; the hook itself is wired in the next implementation step.

- [ ] **Step 3: Implement the hook against the existing Expo audio API**

```ts
const player = useAudioPlayer();
const [queue, setQueue] = useState<SavedSong[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);

function start(songs: SavedSong[]) {
  const nextQueue = buildPreviewQueue(songs);
  setQueue(nextQueue);
  setCurrentIndex(0);
  if (!nextQueue[0]?.previewUrl) return setMessage('No 30-second previews are available in this collection yet.');
  player.replace(nextQueue[0].previewUrl);
  player.play();
  setIsPlaying(true);
}
```

Use `player.pause()` for pause, `player.play()` for resume, `player.replace(url)` before a newly selected item plays, and set `player.currentTime` to `clampPreviewSeek(player.currentTime + deltaSeconds, player.duration)` for seeking. Catch audio operations and set `message` to `Playback could not start. Please try another preview.`

- [ ] **Step 4: Run TypeScript and focused tests**

Run: `npx vitest run src/lib/preview-queue.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the player hook**

```bash
git add src/hooks/use-playlist-preview-player.ts src/lib/preview-queue.test.ts
git commit -m "feat: add playlist preview player hook"
```

### Task 3: Render and wire the Library player

**Files:**
- Create: `src/components/playlist-preview-player.tsx`
- Create: `src/components/playlist-preview-player.test.tsx`
- Modify: `src/app/explore.tsx`

**Interfaces:**
- Consumes: state and callbacks returned by `usePlaylistPreviewPlayer`, and `SavedSong` display data.
- Produces: accessible player controls and Library actions named `Play liked previews` and `Play playlist previews`.

- [ ] **Step 1: Write the failing player-component tests**

```tsx
it('disables Previous at the first queue item and Next at the final queue item', () => {
  render(<PlaylistPreviewPlayer currentSong={song} currentIndex={0} queueLength={1} canPrevious={false} canNext={false} {...callbacks} />);
  expect(screen.getByRole('button', { name: 'Previous preview' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next preview' })).toBeDisabled();
});

it('renders a readable playback error', () => {
  render(<PlaylistPreviewPlayer currentSong={song} message="Playback could not start. Please try another preview." {...props} />);
  expect(screen.getByText('Playback could not start. Please try another preview.')).toBeTruthy();
});
```

- [ ] **Step 2: Run the player tests to verify the RED state**

Run: `npx vitest run src/components/playlist-preview-player.test.tsx`

Expected: FAIL because `PlaylistPreviewPlayer` does not exist.

- [ ] **Step 3: Implement the player panel and library actions**

```tsx
<Pressable accessibilityRole="button" accessibilityLabel="Play liked previews" onPress={() => previewPlayer.start(data.likedSongs)}>
  <Text>Play liked previews</Text>
</Pressable>

{selectedPlaylist && (
  <Pressable accessibilityRole="button" accessibilityLabel={`Play ${selectedPlaylist.name} previews`} onPress={() => previewPlayer.start(selectedPlaylist.songs)}>
    <Text>Play playlist previews</Text>
  </Pressable>
)}
```

Render the panel only when a queue has a current song or when it has a playback/no-preview message. It must show `Song {currentIndex + 1} of {queue.length}`, `Pause preview` or `Play preview`, `Previous preview`, `Back 10 seconds`, `Forward 10 seconds`, and `Next preview` controls. Use the project’s existing black background, yellow primary button, cream text, muted gray text, and red error colors.

- [ ] **Step 4: Run the player tests and typecheck to verify GREEN**

Run: `npx vitest run src/components/playlist-preview-player.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the user interface**

```bash
git add src/components/playlist-preview-player.tsx src/components/playlist-preview-player.test.tsx src/app/explore.tsx
git commit -m "feat: play library preview queues"
```

### Task 4: Final verification and documentation update

**Files:**
- Modify: `plans/prototype-3-implementation-plan.md`

**Interfaces:**
- Consumes: completed queue, hook, and Library UI.
- Produces: an accurate Prototype 3 plan that records the preview-player implementation status.

- [ ] **Step 1: Update the plan’s “What works now” and preview-player section**

```md
- Liked Songs and selected playlists can play a queue of available 30-second previews with pause, previous, next, and ten-second seek controls.
```

- [ ] **Step 2: Run complete verification**

Run: `npm test && npm run typecheck && npx expo config --json > /tmp/lyric-finder-expo-config.json`

Expected: all tests pass, TypeScript has no errors, and Expo config exits with code 0.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff main...HEAD --check && git status --short`

Expected: no whitespace errors and only player-related files changed.

- [ ] **Step 4: Commit the updated plan**

```bash
git add plans/prototype-3-implementation-plan.md
git commit -m "docs: update Prototype 3 player plan"
```

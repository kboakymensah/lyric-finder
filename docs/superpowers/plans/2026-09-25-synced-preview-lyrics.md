# Synced Preview Lyrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add free, auto-scrolling timestamped lyrics to 30-second previews from search results and Library queues.

**Architecture:** A `PreviewPlayerProvider` replaces the separate search and Library player hooks with one player state source. When its active song changes, it fetches LRCLIB timestamped lines through a Worker `/lyrics` endpoint. A pure timing module selects the active line from Expo Audio playback time, and a presentation component scrolls and highlights that line.

**Tech Stack:** Expo Router, React Native, Expo Audio, React context, Cloudflare Workers/Hono, LRCLIB, Vitest, React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-25-synced-preview-lyrics-design.md`

## Global Constraints

- Use LRCLIB only: no Genius scraping, API key, paid service, or secret.
- Preview audio starts immediately; lyric lookup must not block it.
- Keep existing Genius/View Lyrics, Listen on, save, playlist, and preview behavior.
- Support iOS and Android with the installed `expo-audio` package.
- Do not store full lyric text in the saved-song library.

## Review Focus

- Malformed and duplicate LRC timestamps safely produce valid parsed lines or no lines.
- Playback before the first line, between lines, and after the final line has predictable highlighting.
- A late lyric response for an old song cannot overwrite the new active song’s lyric panel.
- Songs without a preview never request lyrics.
- An LRCLIB/network failure leaves the player usable and shows an unavailable message.

---

## File structure

- Create `src/lib/synced-lyrics.ts` and `src/lib/synced-lyrics.test.ts`: pure LRC parsing and active-line logic.
- Create `worker/src/lyrics.ts` and `worker/test/lyrics.test.ts`: free LRCLIB lookup plus Worker tests.
- Create `src/components/synced-lyrics.tsx` and `src/components/synced-lyrics.test.tsx`: lyric display states.
- Create `src/contexts/preview-player-context.tsx` and test: shared audio, queue, timing, and lyric state.
- Modify `_layout.tsx`, `index.tsx`, `explore.tsx`, result components, and `playlist-preview-player.tsx` to consume the shared player.
- Retire the separate `use-preview-player` and `use-playlist-preview-player` hooks after migration.

### Task 1: Create the lyric timing module

**Files:** Create `src/lib/synced-lyrics.ts`; create `src/lib/synced-lyrics.test.ts`.

**Interfaces:**

```ts
export type TimedLyricLine = { timeSeconds: number; text: string };
export function parseSyncedLyrics(value: string | null | undefined): TimedLyricLine[];
export function activeLyricIndex(lines: TimedLyricLine[], currentSeconds: number): number | null;
```

- [ ] **Step 1: Write failing tests** for `[00:01.50]First`, malformed timestamps, duplicate/blank text, and active index at 0.5, 1.5, 9.99, and 10 seconds.
- [ ] **Step 2: Verify failure.** Run `npx vitest run src/lib/synced-lyrics.test.ts`; expect module-not-found failure.
- [ ] **Step 3: Implement minimally.** Parse valid `mm:ss.xx` tags, trim text, sort lines by seconds, and return the most recent timestamp at or before `currentSeconds`.
- [ ] **Step 4: Verify green.** Run `npx vitest run src/lib/synced-lyrics.test.ts && npm run typecheck`; expect pass.
- [ ] **Step 5: Commit.** `git add src/lib/synced-lyrics.ts src/lib/synced-lyrics.test.ts && git commit -m "feat: add synced lyric timing helpers"`.

### Task 2: Add the Worker’s safe LRCLIB endpoint

**Files:** Create `worker/src/lyrics.ts`; create `worker/test/lyrics.test.ts`; modify `worker/src/index.ts`.

**Interfaces:**

```ts
export async function lookupSyncedLyrics(title: string, artist: string, fetcher?: Fetcher): Promise<{ lines: TimedLyricLine[] }>;
// POST /lyrics body: { title: string; artist: string }
// successful response: { lines: TimedLyricLine[] }
```

- [ ] **Step 1: Write failing tests** for a matching LRCLIB `syncedLyrics` response, absent synced lyrics, upstream non-OK response, and invalid title/artist body.
- [ ] **Step 2: Verify failure.** Run `npx vitest run worker/test/lyrics.test.ts`; expect missing endpoint/helper failure.
- [ ] **Step 3: Implement minimally.** Validate title and artist trimmed lengths 1–160. Query `https://lrclib.net/api/get?track_name=<title>&artist_name=<artist>` with `Lrclib-Client: LyricFinder/1.0`; parse valid lines, cap output at 500, and return `{ lines: [] }` for no match/no synced lyrics/upstream failure. Return HTTP 400 only for invalid client input.
- [ ] **Step 4: Verify green.** Run `npx vitest run worker/test/lyrics.test.ts worker/test/search.test.ts`; expect pass.
- [ ] **Step 5: Commit.** `git add worker/src/lyrics.ts worker/src/index.ts worker/test/lyrics.test.ts && git commit -m "feat: add free synced lyrics endpoint"`.

### Task 3: Create the lyrics display component

**Files:** Create `src/components/synced-lyrics.tsx`; create `src/components/synced-lyrics.test.tsx`.

**Interfaces:**

```ts
type SyncedLyricsProps = {
  lines: TimedLyricLine[];
  currentSeconds: number;
  isLoading: boolean;
  message: string | null;
};
```

- [ ] **Step 1: Write failing component tests** for “Loading timed lyrics…”, the yellow active line, inactive-line color, and “Timed lyrics aren’t available for this song.” with empty lines.
- [ ] **Step 2: Verify failure.** Run `npx vitest run src/components/synced-lyrics.test.tsx`; expect missing component failure.
- [ ] **Step 3: Implement minimally.** Render a bounded `ScrollView`; compute active index with Task 1, highlight it in `#F7C948`, and scroll when the active index changes. The component must not fetch data or control audio.
- [ ] **Step 4: Verify green.** Run `npx vitest run src/components/synced-lyrics.test.tsx`; expect pass.
- [ ] **Step 5: Commit.** `git add src/components/synced-lyrics.tsx src/components/synced-lyrics.test.tsx && git commit -m "feat: show synchronized preview lyrics"`.

### Task 4: Build one shared player provider

**Files:** Create `src/contexts/preview-player-context.tsx` and test; modify `src/app/_layout.tsx`; retire `src/hooks/use-preview-player.ts`, `src/hooks/use-playlist-preview-player.ts`, and its tests after migration.

**Interfaces:**

```ts
type PreviewPlayer = {
  currentSong: SongResult | SavedSong | null;
  currentSeconds: number;
  lyricLines: TimedLyricLine[];
  lyricLoading: boolean;
  lyricMessage: string | null;
  startSong(song: SongResult): void;
  startQueue(songs: SavedSong[]): void;
  toggle(): void; next(): void; previous(): void; seekBy(seconds: number): Promise<void>;
};
```

- [ ] **Step 1: Write failing provider tests** for single search-song playback, Library queue navigation, no preview URL never fetching `/lyrics`, zero lines showing the unavailable message, Expo Audio current time feeding `currentSeconds`, and a stale first request being ignored after moving to a second song.
- [ ] **Step 2: Verify failure.** Run `npx vitest run src/contexts/preview-player-context.test.tsx`; expect missing provider failure.
- [ ] **Step 3: Implement minimally.** Use `useAudioPlayer` and `useAudioPlayerStatus`; preserve queue/seek/boundary behavior from the current Library hook. On every active-song change, clear old lyric state, play immediately, then request `/lyrics` with `fetchWithTimeout`. Protect async responses with a monotonically increasing request ID. Mount `<PreviewPlayerProvider>` inside the existing `LibraryProvider` in `_layout.tsx`.
- [ ] **Step 4: Verify green.** Run `npx vitest run src/contexts/preview-player-context.test.tsx src/lib/preview-queue.test.ts`; expect pass.
- [ ] **Step 5: Commit.** Commit provider/context/layout and retired-hook migration with `feat: share preview playback and lyric state`.

### Task 5: Migrate search, Library, and player UI

**Files:** Modify `src/app/index.tsx`, `src/app/explore.tsx`, `src/components/song-results.tsx`, `src/components/song-result-card.tsx`, `src/components/playlist-preview-player.tsx`, and corresponding component tests.

- [ ] **Step 1: Write failing integration tests** proving the search Preview action calls `startSong`, Library Play all calls `startQueue`, and the player panel receives and renders timed lines.
- [ ] **Step 2: Verify failure.** Run the focused result-card/player tests; expect props/actions unavailable.
- [ ] **Step 3: Implement minimally.** Replace each old hook with the context hook. Keep View Lyrics, Listen on, Save, Add to Playlist, and preview availability behavior unchanged. Render `SyncedLyrics` beneath the shared player controls in the existing bee palette.
- [ ] **Step 4: Verify green.** Run `npm test && npm run typecheck`; expect pass.
- [ ] **Step 5: Commit.** `git add src && git commit -m "feat: sync lyrics across search and library previews"`.

### Task 6: Verify, document, and deploy with approval

**Files:** Modify `plans/prototype-3-implementation-plan.md` and `changelog.md`.

- [ ] **Step 1: Run an on-device-safe integration check.** With permission, send one non-sensitive song title/artist to the deployed Worker and confirm a JSON `{ lines }` response without logging secrets.
- [ ] **Step 2: Document delivery.** Add a Prototype 3 changelog entry for shared previews, free LRCLIB synced lyrics, unavailable fallback, and preserved Genius links.
- [ ] **Step 3: Run verification.** `npm test && npm run typecheck && npx wrangler deploy --dry-run`; expect pass/validated Worker package.
- [ ] **Step 4: Commit.** `git add plans/prototype-3-implementation-plan.md changelog.md && git commit -m "docs: record synced lyrics delivery"`.
- [ ] **Step 5: Deploy only after user approval.** Run `npx wrangler deploy`, then `npx eas-cli@latest update --branch testing --environment preview --message "Add synchronized preview lyrics"`; confirm the Expo dashboard URL and QR code.

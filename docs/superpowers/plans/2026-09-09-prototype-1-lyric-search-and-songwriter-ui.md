# Prototype 1 Lyric Search and Songwriter UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reliably find songs from lyric fragments and render ranked, black-and-yellow songwriter-themed results with album art and available 30-second previews.

**Architecture:** The Cloudflare Worker remains key-free: it searches LRCLIB with normalized lyric variants, merges and ranks lyric candidates, then enriches each distinct result through iTunes Search. The Expo app consumes one typed `SongResult` model, renders the highest-ranked item as Best match, and uses one Expo audio player for in-place preview playback.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, `expo-audio`, `expo-image`, Hono, LRCLIB, iTunes Search API, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-lyric-search-and-songwriter-ui-design.md`

## Global Constraints

- Keep the Expo/React Native app and Cloudflare Worker architecture.
- Use no paid services, user accounts, API keys, or secrets.
- Do not use Genius. Use LRCLIB for lyric search and iTunes Search for catalog metadata, artwork, preview URLs, and listening links.
- Keep `.env` out of version control.
- Return at most five results and preserve a valid LRCLIB match when iTunes metadata is unavailable.
- Only one preview may play at a time.

---

## File Structure

```
worker/src/search.ts                         lyric-query normalization, deduplication, scoring, catalog enrichment
worker/test/search.test.ts                   Worker search-unit tests with fake LRCLIB/iTunes responses
src/types/song.ts                            Stable mobile result and API-response types
src/components/song-result-card.tsx          Reusable Best match / alternative-result card
src/components/song-results.tsx              Result grouping and empty-result renderer
src/hooks/use-preview-player.ts              Single-player Expo audio preview controller
src/app/index.tsx                            Search state, screen composition, black-and-yellow stylesheet
__tests__/song-result-card.test.tsx          Card accessibility and action rendering tests
```

### Task 1: Make Worker lyric search normalize, rank, and preserve results

**Files:**
- Modify: `worker/src/search.ts`
- Modify: `worker/test/search.test.ts`

**Interfaces:**
- Produces `normalizeLyricQuery(query: string): string[]` with the original trimmed query first and one whitespace-normalized variant only when distinct.
- Produces `scoreLyricMatch(query: string, lyrics?: string | null): number` returning an integer from 0 through 100.
- Produces `searchSongs(query: string, fetcher?: Fetcher): Promise<SongResult[]>`, ordered best-first and limited to five.
- `SongResult` contains `id`, `title`, `artist`, `artworkUrl`, `lyricSnippet`, `previewUrl`, `listenUrl`, and `matchScore`.

- [ ] **Step 1: Write failing Worker tests for lyric ranking, deduplication, and catalog fallback**

```ts
it('ranks the candidate whose lyrics overlap the remembered phrase first', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([
      { id: 1, trackName: 'Wrong Song', artistName: 'Artist', plainLyrics: 'a different chorus entirely' },
      { id: 2, trackName: 'Hello', artistName: 'Adele', plainLyrics: 'Hello from the other side' },
    ])))
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }))));

  const results = await searchSongs('hello from the other side', fetcher);
  expect(results[0]).toMatchObject({ title: 'Hello', artist: 'Adele' });
  expect(results[0].matchScore).toBeGreaterThan(results[1].matchScore);
});

it('keeps a lyric match when iTunes returns no catalog result', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([
      { id: 3, trackName: 'Uncatalogued', artistName: 'Writer', plainLyrics: 'hold on to the words tonight' },
    ])))
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }))));

  await expect(searchSongs('hold on to the words tonight', fetcher)).resolves.toEqual([
    expect.objectContaining({ title: 'Uncatalogued', artworkUrl: null, previewUrl: null }),
  ]);
});

it('returns a single result for duplicate title and artist candidates', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([
      { id: 4, trackName: 'Hello', artistName: 'Adele', plainLyrics: 'Hello from the other side' },
      { id: 5, trackName: ' hello ', artistName: ' adele ', plainLyrics: 'Hello from the other side again' },
    ])))
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }))));

  const results = await searchSongs('hello from the other side', fetcher);
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({ title: 'Hello', artist: 'Adele' });
});
```

- [ ] **Step 2: Run the focused test file and verify it fails**

Run: `npm test -- worker/test/search.test.ts`

Expected: FAIL because the existing implementation preserves LRCLIB order and has no candidate deduplication helper.

- [ ] **Step 3: Add pure search helpers and use them before iTunes enrichment**

```ts
const tokenSet = (value: string) => new Set(
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean),
);

export function scoreLyricMatch(query: string, lyrics?: string | null) {
  const queryTokens = tokenSet(query);
  const lyricTokens = tokenSet(lyrics ?? '');
  if (queryTokens.size === 0) return 0;
  const overlap = [...queryTokens].filter((token) => lyricTokens.has(token)).length;
  return Math.round((overlap / queryTokens.size) * 100);
}

const candidateKey = (track: LrcTrack) =>
  `${track.trackName.trim().toLowerCase()}::${track.artistName.trim().toLowerCase()}`;
```

Call LRCLIB using each distinct `normalizeLyricQuery` variant, flatten the responses, preserve the first candidate for each `candidateKey`, score every candidate using `plainLyrics`, sort by descending score with original provider position as the tie-breaker, then limit to five before iTunes calls. Retain the existing Google listening fallback for missing iTunes records.

- [ ] **Step 4: Run Worker tests and type checks**

Run: `npm test -- worker/test/search.test.ts && npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the search milestone**

```bash
git add worker/src/search.ts worker/test/search.test.ts
git commit -m "Improve lyric search ranking and result enrichment"
```

### Task 2: Define the mobile result model and songwriter result cards

**Files:**
- Create: `src/types/song.ts`
- Create: `src/components/song-result-card.tsx`
- Create: `src/components/song-results.tsx`
- Create: `__tests__/song-result-card.test.tsx`

**Interfaces:**
- Produces `SongResult` and `SongSearchResponse` mobile types matching the Worker response exactly.
- Produces `<SongResultCard song={song} emphasis="best" | "alternative" isPlaying={boolean} onTogglePreview={() => void} />`.
- Produces `<SongResults songs={songs} hasSearched={boolean} isPlayingId={string | null} onTogglePreview={(song: SongResult) => void} />`.

- [ ] **Step 1: Write card tests for visible metadata and preview availability**

```tsx
it('shows title, artist, artwork fallback, and lyric snippet', () => {
  render(<SongResultCard song={song} emphasis="best" isPlaying={false} onTogglePreview={vi.fn()} />);
  expect(screen.getByText('Hello')).toBeTruthy();
  expect(screen.getByText('Adele')).toBeTruthy();
  expect(screen.getByText('“Hello from the other side”')).toBeTruthy();
});

it('shows Preview only when a preview URL is available', () => {
  render(<SongResultCard song={{ ...song, previewUrl: null }} emphasis="alternative" isPlaying={false} onTogglePreview={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /preview/i })).toBeNull();
});
```

- [ ] **Step 2: Run the card test and verify it fails**

Run: `npm test -- __tests__/song-result-card.test.tsx`

Expected: FAIL because the component and `SongResult` type do not exist.

- [ ] **Step 3: Add typed cards and grouped results**

```tsx
export type SongResult = {
  id: string; title: string; artist: string; artworkUrl: string | null;
  lyricSnippet: string | null; previewUrl: string | null; listenUrl: string; matchScore: number;
};
```

Render `artworkUrl` with `expo-image` and a high-contrast musical-note fallback when it is null. Use `accessibilityLabel` values `Preview {title}`, `Pause {title}`, and `Listen to {title}`. In `SongResults`, render `songs[0]` beneath a `Best match` heading and `songs.slice(1)` beneath `More possible songs`; render nothing for the second heading when there are no alternatives.

- [ ] **Step 4: Run focused UI tests and type checks**

Run: `npm test -- __tests__/song-result-card.test.tsx && npm run typecheck`

Expected: both commands exit 0.

### Task 3: Compose the black-and-yellow search screen and explicit states

**Files:**
- Modify: `src/app/index.tsx`
- Modify: `src/components/song-results.tsx`

**Interfaces:**
- Consumes `SongSearchResponse` from `POST {EXPO_PUBLIC_API_BASE_URL}/search`.
- Owns `lyrics`, `songs`, `hasSearched`, `message`, and `loading` state.
- Passes `songs` and preview callbacks to `SongResults`.

- [ ] **Step 1: Add a failing no-results assertion to the component test**

```tsx
it('shows the no-results guidance for an empty result list', () => {
  render(<SongResults songs={[]} hasSearched isPlayingId={null} onTogglePreview={vi.fn()} />);
  expect(screen.getByText(/no close lyric matches yet/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- __tests__/song-result-card.test.tsx`

Expected: FAIL because empty results do not currently have a dedicated UI state.

- [ ] **Step 3: Replace the inline results map with the composed screen**

Render the search screen as a `ScrollView` with a near-black `#0B0B0A` canvas, yellow `#F7C948` primary actions, cream `#FFF7DF` titles, and muted `#BDB6A4` helper copy. Keep one lyric-input action. Add a compact top motif such as `♪  ✎  ♫` above the `LYRIC FINDER` kicker; do not introduce image assets solely for decoration. Set `hasSearched` only after an HTTP-successful response. `SongResults` displays `No close lyric matches yet. Try another line from the chorus.` only when `hasSearched` is true and `songs` is empty. Preserve the existing validation and timeout error copy.

- [ ] **Step 4: Run all non-audio tests and type checks**

Run: `npm test && npm run typecheck`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the visual milestone**

```bash
git add src/app/index.tsx src/types/song.ts src/components/song-result-card.tsx src/components/song-results.tsx __tests__/song-result-card.test.tsx
git commit -m "Add black and yellow songwriter results experience"
```

### Task 4: Add one-at-a-time preview playback and final verification

**Files:**
- Create: `src/hooks/use-preview-player.ts`
- Modify: `src/app/index.tsx`
- Modify: `__tests__/song-result-card.test.tsx`

**Interfaces:**
- Produces `usePreviewPlayer(): { playingId: string | null; togglePreview: (song: SongResult) => void }`.
- Uses one `useAudioPlayer()` instance and its `replace`, `play`, and `pause` methods.
- A song with `previewUrl: null` never reaches the controller.

- [ ] **Step 1: Add a preview-label test**

```tsx
it('changes the available preview action from Preview to Pause while playing', () => {
  render(<SongResultCard song={song} emphasis="best" isPlaying onTogglePreview={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Pause Hello' })).toBeTruthy();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/song-result-card.test.tsx`

Expected: FAIL because the card has no playback-state-aware label.

- [ ] **Step 3: Implement the controller and connect it to cards**

```ts
const player = useAudioPlayer();
const [playingId, setPlayingId] = useState<string | null>(null);

function togglePreview(song: SongResult) {
  if (!song.previewUrl) return;
  if (playingId === song.id) { player.pause(); setPlayingId(null); return; }
  player.replace(song.previewUrl);
  player.play();
  setPlayingId(song.id);
}
```

Use this hook once in `src/app/index.tsx`, pass the state and callback to `SongResults`, and change the preview button label between Preview and Pause. Do not create one audio player per card.

- [ ] **Step 4: Run the full automated suite and real Worker smoke test**

Run:

```bash
npm test
npm run typecheck
curl -sS -X POST "$EXPO_PUBLIC_API_BASE_URL/search" -H 'content-type: application/json' --data '{"lyrics":"hello from the other side"}'
```

Expected: tests and type check exit 0; Worker JSON contains `results` with a ranked title/artist and includes catalog fields when iTunes returns a match.

- [ ] **Step 5: Commit the playback milestone**

```bash
git add src/hooks/use-preview-player.ts src/app/index.tsx src/components/song-result-card.tsx __tests__/song-result-card.test.tsx
git commit -m "Add preview playback and search state coverage"
```

### Task 5: Deploy the Worker and test on device

**Files:**
- Modify only if required by deployment diagnostics: `worker/src/search.ts` or `worker/wrangler.jsonc`

**Interfaces:**
- The deployed Worker URL remains the value of `EXPO_PUBLIC_API_BASE_URL` in the ignored `.env` file.

- [ ] **Step 1: Deploy the tested Worker**

Run: `npx wrangler deploy --config worker/wrangler.jsonc`

Expected: Wrangler reports the Worker URL without exposing any secret.

- [ ] **Step 2: Start a fresh Expo session and scan it in Expo Go**

Run: `npx expo start --clear`

Expected: Expo prints a QR code for this workspace.

- [ ] **Step 3: Manually verify the full lyric path**

Enter `hello from the other side`. Confirm Best match displays a title, artist, album cover when iTunes returns one, preview control when available, More possible songs when returned, and a working Listen handoff.

- [ ] **Step 4: Record only any real defects found**

If a defect occurs, add a short factual entry to `bugs.md`; otherwise do not change it.

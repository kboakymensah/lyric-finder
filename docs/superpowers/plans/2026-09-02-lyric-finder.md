# Lyric Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform app that finds songs from remembered lyric fragments, plays available 30-second previews, and opens a platform-neutral music-service or web result.

**Architecture:** An Expo React Native app calls a small Cloudflare Worker API. The worker keeps the licensed lyrics-provider credential secret, converts provider responses into a stable result model, and returns no more than five results. The app renders the results, uses `expo-audio` for one active preview at a time, and uses `expo-linking` for a platform-neutral Listen handoff.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router, `expo-audio`, `expo-linking`, Vitest, React Native Testing Library, Cloudflare Workers, Hono, Zod, Wrangler, Miniflare/Vitest.

**Spec:** `docs/superpowers/specs/2026-09-02-lyric-finder-design.md`

## Global Constraints

- Use one Expo TypeScript codebase for iPhone via Expo Go and Android via Google Play internal testing.
- Target Expo SDK 57 / Android 7+ / iOS 16.4+; use Node.js 22.13 or newer.
- Do not put a lyrics-provider key in the mobile app, committed files, or client-visible configuration.
- Accept only a non-empty, trimmed lyric fragment of at least 8 characters; submit it only to the backend search endpoint.
- Return at most five normalized results, each with `id`, `title`, `artist`, `artworkUrl`, `lyricSnippet`, `previewUrl`, `listenUrl`, and `matchScore`.
- Do not implement user accounts, search history, social features, or permanent raw-lyric logging.
- Show a lyric snippet only when the provider includes one; never synthesize or scrape lyrics.
- Starting a preview must stop any existing preview.
- Distribute Android through Google Play internal testing; use Expo Go for iPhone development.

---

## File structure

```
app/
  _layout.tsx                 Expo Router root layout
  index.tsx                   Search screen composition
components/
  SearchComposer.tsx          Controlled lyric input and validation feedback
  SearchResultCard.tsx        Song card, preview action, and platform-neutral Listen action
  SearchResultList.tsx        Ranked-result and empty-state renderer
hooks/
  useSongSearch.ts            Search request state machine
  usePreviewPlayer.ts         One-active-preview audio controller
lib/
  api.ts                      Typed client for the Worker endpoint
  validation.ts               Shared client-side lyric input rule
types/
  song.ts                     Mobile-side result and API response types
__tests__/
  validation.test.ts          Input-rule tests
  useSongSearch.test.ts       Search state and failure tests
  SearchResultCard.test.tsx   UI action tests

worker/
  src/index.ts                Hono Worker routes and request boundary
  src/schema.ts               Zod input/output schemas
  src/types.ts                Provider and normalized-domain types
  src/lyricsProvider.ts       Musixmatch HTTP adapter
  src/musicCatalog.ts         iTunes catalog enrichment for cover art and preview audio
  src/normalize.ts            Provider-to-result mapping and ordering
  src/errors.ts               Safe API error response helpers
  test/search.test.ts         Worker route tests with a fake provider
  wrangler.jsonc              Worker name, compatibility date, bindings
  package.json                Worker scripts and dependencies
  vitest.config.ts            Worker test configuration

app.json                       Expo metadata, Android package name, deep-link scheme
eas.json                       Android internal-testing build profile
package.json                   App scripts and dependencies
.env.example                   Public mobile endpoint variable name only
worker/.dev.vars.example       Provider credential variable name only
README.md                      Local run, secrets, Expo Go, and Android-test instructions
```

### Task 1: Create the Expo workspace and project guardrails

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `app.json`
- Create: `eas.json`
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Test: `package.json` scripts

**Interfaces:**
- Produces: an Expo Router app with `EXPO_PUBLIC_API_BASE_URL` as the only client configuration variable.
- Produces: `npm run test`, `npm run lint`, and `npm run typecheck` scripts used by all later mobile tasks.

- [ ] **Step 1: Initialize source control and scaffold the Expo TypeScript router project**

Run:

```bash
git init
npx create-expo-app@latest . --template default@sdk-57
npx expo install expo-audio expo-linking
```

- [ ] **Step 2: Replace the scaffolded root layout with the app shell**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Configure the app identity and Android internal-test build profile**

```json
// eas.json
{
  "build": {
    "internal": {
      "distribution": "store",
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

Use `com.yourname.lyricfinder` as a temporary `android.package` value only after replacing `yourname` with the actual reverse-domain owner identifier. Set `scheme` to `lyricfinder`.

- [ ] **Step 4: Add the public endpoint template and secret exclusions**

```dotenv
# .env.example
EXPO_PUBLIC_API_BASE_URL=https://lyrics-api.example.workers.dev
```

Ensure `.gitignore` includes `.env`, `worker/.dev.vars`, and `.expo/`, while retaining `.env.example` and `worker/.dev.vars.example` in source control.

- [ ] **Step 5: Add quality scripts**

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "vitest run",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Verify the scaffold commands work**

Run: `npm run typecheck && npm run lint`

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit the project foundation**

```bash
git add app app.json eas.json package.json .gitignore .env.example README.md
git commit -m "chore: scaffold Expo lyric finder app"
```

### Task 2: Implement the secure lyric-search Worker

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.jsonc`
- Create: `worker/src/types.ts`
- Create: `worker/src/schema.ts`
- Create: `worker/src/errors.ts`
- Create: `worker/src/lyricsProvider.ts`
- Create: `worker/src/musicCatalog.ts`
- Create: `worker/src/normalize.ts`
- Create: `worker/src/index.ts`
- Create: `worker/test/search.test.ts`
- Create: `worker/.dev.vars.example`
- Test: `worker/test/search.test.ts`

**Interfaces:**
- Consumes: `POST /search` JSON body `{ lyrics: string }`.
- Produces: HTTP 200 body `{ results: SongResult[] }` or safe 400/429/502 errors.
- Produces: `LyricsProvider.searchByLyrics(lyrics: string): Promise<ProviderTrack[]>` and `MusicCatalog.findTrack(title: string, artist: string): Promise<CatalogTrack | null>` for injection in route tests.

- [ ] **Step 1: Write the failing schema and route tests**

```ts
// worker/test/search.test.ts
it('returns normalized matches for a valid lyric fragment', async () => {
  const response = await app.request('/search', {
    method: 'POST',
    body: JSON.stringify({ lyrics: 'hello from the other side' }),
    headers: { 'content-type': 'application/json' },
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    results: [expect.objectContaining({
      title: 'Hello', artist: 'Adele', matchScore: expect.any(Number),
    })],
  });
});

it('rejects a lyric fragment shorter than eight characters', async () => {
  const response = await app.request('/search', {
    method: 'POST', body: JSON.stringify({ lyrics: 'hello' }),
    headers: { 'content-type': 'application/json' },
  });
  expect(response.status).toBe(400);
});
```

- [ ] **Step 2: Run the Worker test to verify it fails**

Run: `npm --prefix worker test -- search.test.ts`

Expected: FAIL because the Worker route is not implemented.

- [ ] **Step 3: Define stable validation and result types**

```ts
// worker/src/types.ts
export type SongResult = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  lyricSnippet: string | null;
  previewUrl: string | null;
  listenUrl: string | null;
  matchScore: number;
};

export interface LyricsProvider {
  searchByLyrics(lyrics: string): Promise<ProviderTrack[]>;
}
```

```ts
// worker/src/schema.ts
import { z } from 'zod';
export const searchRequestSchema = z.object({
  lyrics: z.string().trim().min(8).max(500),
});
```

- [ ] **Step 4: Implement the provider adapter, catalog enrichment, and normalizer**

Use the Musixmatch `track.search` endpoint with a server-only `MUSIXMATCH_API_KEY`, `q_lyrics`, `f_has_lyrics=1`, `page_size=5`, and `s_track_rating=desc`. Convert only provider fields available in the response. Keep a `null` URL/snippet when unavailable; do not fetch or scrape full lyrics.

Use Apple’s iTunes Search API server-side to enrich each provider result by its exact title and artist. Map the catalog’s `artworkUrl100` and `previewUrl` to `artworkUrl` and `previewUrl`. Generate `listenUrl` as an HTTPS Google search for the exact title, artist, and word `song`; this is platform-neutral and can be opened by an installed compatible handler or the browser. Do not return a catalog URL as a lyric snippet.

```ts
// worker/src/normalize.ts
export function normalizeTrack(track: ProviderTrack, catalog: CatalogTrack | null, index: number): SongResult {
  return {
    id: String(track.track_id),
    title: track.track_name,
    artist: track.artist_name,
    artworkUrl: catalog?.artworkUrl ?? track.album_coverart_350x350 ?? null,
    lyricSnippet: track.lyrics_snippet ?? null,
    previewUrl: catalog?.previewUrl ?? null,
    listenUrl: `https://www.google.com/search?q=${encodeURIComponent(`${track.track_name} ${track.artist_name} song`)}`,
    matchScore: Math.max(0, 100 - index * 12),
  };
}
```

- [ ] **Step 5: Implement the Hono route with safe errors**

```ts
// worker/src/index.ts
app.post('/search', async (c) => {
  const parsed = searchRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: 'Enter at least 8 characters of lyrics.' }, 400);
  try {
    const tracks = await provider.searchByLyrics(parsed.data.lyrics);
    const results = await Promise.all(tracks.slice(0, 5).map(async (track, index) =>
      normalizeTrack(track, await catalog.findTrack(track.track_name, track.artist_name), index),
    ));
    return c.json({ results });
  } catch {
    return c.json({ error: 'Search is temporarily unavailable. Please try again.' }, 502);
  }
});
```

Add a rate-limit binding/guard before this route and return HTTP 429 with `{ error: 'Too many searches. Please wait a moment.' }` when its per-IP limit is exceeded.

- [ ] **Step 6: Run Worker tests and typecheck**

Run: `npm --prefix worker test && npm --prefix worker run typecheck`

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit the Worker**

```bash
git add worker
git commit -m "feat: add secure lyric search worker"
```

### Task 3: Build typed mobile search and result state

**Files:**
- Create: `types/song.ts`
- Create: `lib/validation.ts`
- Create: `lib/api.ts`
- Create: `hooks/useSongSearch.ts`
- Create: `__tests__/validation.test.ts`
- Create: `__tests__/useSongSearch.test.ts`
- Test: `__tests__/validation.test.ts`
- Test: `__tests__/useSongSearch.test.ts`

**Interfaces:**
- Consumes: `EXPO_PUBLIC_API_BASE_URL` and Worker `POST /search` response.
- Produces: `validateLyrics(lyrics: string): string | null`.
- Produces: `useSongSearch(): { results, isLoading, error, search, reset }`.

- [ ] **Step 1: Write failing validation tests**

```ts
import { validateLyrics } from '../lib/validation';

it('requires at least eight non-whitespace characters', () => {
  expect(validateLyrics('  hello  ')).toBe('Enter at least a few lyric words.');
  expect(validateLyrics('hello from the other side')).toBeNull();
});
```

- [ ] **Step 2: Run validation test to verify it fails**

Run: `npm test -- validation.test.ts`

Expected: FAIL because `validateLyrics` does not exist.

- [ ] **Step 3: Implement validation and API client**

```ts
// lib/validation.ts
export function validateLyrics(lyrics: string): string | null {
  return lyrics.trim().length >= 8 ? null : 'Enter at least a few lyric words.';
}
```

```ts
// lib/api.ts
export async function searchSongs(lyrics: string): Promise<SongResult[]> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/search`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lyrics }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Search is temporarily unavailable. Please try again.');
  return payload.results;
}
```

- [ ] **Step 4: Write failing search-hook tests**

```ts
it('exposes the provider failure as a friendly message', async () => {
  mockedSearchSongs.mockRejectedValue(new Error('Search is temporarily unavailable. Please try again.'));
  const { result } = renderHook(() => useSongSearch());
  await act(() => result.current.search('hello from the other side'));
  expect(result.current.error).toBe('Search is temporarily unavailable. Please try again.');
});
```

- [ ] **Step 5: Implement the state hook**

```ts
export function useSongSearch() {
  const [results, setResults] = useState<SongResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = async (lyrics: string) => { /* validate, clear error, await searchSongs, set results/error */ };
  const reset = () => { setResults([]); setError(null); };
  return { results, isLoading, error, search, reset };
}
```

Implement the comment by: returning immediately when validation fails; setting `isLoading` before the request; clearing results for a new request; assigning API results on success; converting any caught error to its message; and resetting loading in `finally`.

- [ ] **Step 6: Run mobile state tests and typecheck**

Run: `npm test -- validation.test.ts useSongSearch.test.ts && npm run typecheck`

Expected: all tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit search state**

```bash
git add types lib hooks __tests__
git commit -m "feat: add lyric search state"
```

### Task 4: Implement the search and result interface

**Files:**
- Create: `components/SearchComposer.tsx`
- Create: `components/SearchResultList.tsx`
- Create: `components/SearchResultCard.tsx`
- Modify: `app/index.tsx`
- Create: `__tests__/SearchComposer.test.tsx`
- Create: `__tests__/SearchResultCard.test.tsx`
- Test: `__tests__/SearchComposer.test.tsx`
- Test: `__tests__/SearchResultCard.test.tsx`

**Interfaces:**
- Consumes: `useSongSearch()` and `SongResult` from Task 3.
- Produces: `SearchComposer({ onSearch, isLoading })` and `SearchResultCard({ result, onPreview })`.

- [ ] **Step 1: Write failing interaction tests**

```tsx
it('sends the entered lyric fragment when Search is pressed', () => {
  const onSearch = vi.fn();
  const screen = render(<SearchComposer onSearch={onSearch} isLoading={false} />);
  fireEvent.changeText(screen.getByLabelText('Lyrics'), 'hello from the other side');
  fireEvent.press(screen.getByText('Search'));
  expect(onSearch).toHaveBeenCalledWith('hello from the other side');
});

it('opens a platform-neutral listen result for a song', async () => {
  render(<SearchResultCard result={result} onPreview={vi.fn()} />);
  fireEvent.press(screen.getByText('Listen'));
  expect(Linking.openURL).toHaveBeenCalledWith(result.listenUrl);
});
```

- [ ] **Step 2: Run UI tests to verify they fail**

Run: `npm test -- SearchComposer.test.tsx SearchResultCard.test.tsx`

Expected: FAIL because the components are not implemented.

- [ ] **Step 3: Implement the accessible search composer**

```tsx
<TextInput
  accessibilityLabel="Lyrics"
  multiline
  placeholder="Type a line or two you remember…"
  value={lyrics}
  onChangeText={setLyrics}
/>
<Pressable accessibilityRole="button" onPress={() => onSearch(lyrics)} disabled={isLoading}>
  <Text>{isLoading ? 'Searching…' : 'Search'}</Text>
</Pressable>
```

Render the validation message beneath the field and disable the action only while a request is active.

- [ ] **Step 4: Implement result cards and list states**

Each result card renders accessible cover-art alternative text (`Cover art for {title}`), title, artist, confidence as a percentage, a snippet only when `lyricSnippet !== null`, a preview button, and a `Listen` button when `listenUrl !== null`. `SearchResultList` renders the exact empty message: `No likely matches. Try a shorter or different lyric line.` when a completed search has zero results.

- [ ] **Step 5: Compose all states in the home route**

```tsx
export default function HomeScreen() {
  const search = useSongSearch();
  return (
    <SafeAreaView>
      <Text>What lyrics do you remember?</Text>
      <SearchComposer onSearch={search.search} isLoading={search.isLoading} />
      {search.error && <Text accessibilityRole="alert">{search.error}</Text>}
      <SearchResultList results={search.results} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Run UI tests, lint, and typecheck**

Run: `npm test -- SearchComposer.test.tsx SearchResultCard.test.tsx && npm run lint && npm run typecheck`

Expected: all checks exit with code 0.

- [ ] **Step 7: Commit the UI**

```bash
git add app components __tests__
git commit -m "feat: add lyric search interface"
```

### Task 5: Add cross-platform preview playback and platform-neutral listening handoff

**Files:**
- Create: `hooks/usePreviewPlayer.ts`
- Modify: `components/SearchResultCard.tsx`
- Modify: `app/index.tsx`
- Create: `__tests__/usePreviewPlayer.test.ts`
- Modify: `__tests__/SearchResultCard.test.tsx`
- Test: `__tests__/usePreviewPlayer.test.ts`

**Interfaces:**
- Consumes: `SongResult.previewUrl`, `SongResult.listenUrl`, `expo-audio`, and `expo-linking`.
- Produces: `usePreviewPlayer(): { activePreviewId: string | null; togglePreview(id: string, url: string): Promise<void>; stopPreview(): void }`.

- [ ] **Step 1: Write the failing audio-controller test**

```ts
it('stops the active preview before starting another', async () => {
  const { result } = renderHook(() => usePreviewPlayer());
  await act(() => result.current.togglePreview('first', 'https://cdn.example/first.m4a'));
  await act(() => result.current.togglePreview('second', 'https://cdn.example/second.m4a'));
  expect(mockFirstPlayer.pause).toHaveBeenCalledOnce();
  expect(mockSecondPlayer.play).toHaveBeenCalledOnce();
  expect(result.current.activePreviewId).toBe('second');
});
```

- [ ] **Step 2: Run the audio test to verify it fails**

Run: `npm test -- usePreviewPlayer.test.ts`

Expected: FAIL because `usePreviewPlayer` does not exist.

- [ ] **Step 3: Implement the single-player controller**

Use one audio-player instance held by the hook. When `togglePreview` receives the current ID, pause it and clear `activePreviewId`. When it receives a new ID, pause any current playback, replace the source URL, play it, and set the new active ID. Subscribe to playback completion and clear `activePreviewId`; clean up the player on hook unmount.

```ts
type PreviewController = {
  activePreviewId: string | null;
  togglePreview(id: string, url: string): Promise<void>;
  stopPreview(): void;
};
```

- [ ] **Step 4: Connect preview state to cards**

Pass `isPreviewing={activePreviewId === result.id}` and `onPreview={() => togglePreview(result.id, result.previewUrl!)}` only when `previewUrl` is non-null. For missing URLs render disabled text `Preview unavailable` instead of a playable control.

- [ ] **Step 5: Handle Listen links safely**

```ts
async function openListenUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error('A music link is unavailable on this device.');
  await Linking.openURL(url);
}
```

Catch this error in the card and display `Unable to open a music link right now.` inline without changing preview state.

- [ ] **Step 6: Run playback/UI tests and full mobile checks**

Run: `npm test && npm run lint && npm run typecheck`

Expected: all commands exit with code 0.

- [ ] **Step 7: Commit playback and handoff**

```bash
git add hooks components app __tests__
git commit -m "feat: add previews and platform-neutral listening"
```

### Task 6: Prepare provider credentials, devices, and internal-test delivery

**Files:**
- Modify: `worker/.dev.vars.example`
- Modify: `worker/wrangler.jsonc`
- Modify: `README.md`
- Modify: `app.json`
- Modify: `eas.json`
- Test: manual iPhone Expo Go and Android internal-test checklist in `README.md`

**Interfaces:**
- Consumes: deployed Worker URL, configured `MUSIXMATCH_API_KEY`, Expo account, and Google Play Console account.
- Produces: a documented developer setup, Worker deployment, Android AAB build profile, and internal-test release procedure.

- [ ] **Step 1: Document secret templates without values**

```dotenv
# worker/.dev.vars.example
MUSIXMATCH_API_KEY=replace-with-a-licensed-provider-key
```

Use `wrangler secret put MUSIXMATCH_API_KEY` for the deployed Worker; do not place the value in `wrangler.jsonc`.

- [ ] **Step 2: Add deployment and run instructions to the README**

Include these exact commands:

```bash
npm install
cp .env.example .env
npm --prefix worker install
cp worker/.dev.vars.example worker/.dev.vars
npx expo start
npx wrangler deploy --config worker/wrangler.jsonc
eas build --platform android --profile internal
```

State that Expo Go is the supported iPhone path and that the Android `.aab` upload goes to Play Console → Testing → Internal testing. Document sharing the generated opt-in URL with explicitly invited testers.

- [ ] **Step 3: Perform local verification with a provider test key**

Run: `npm --prefix worker test && npm test && npm run lint && npm run typecheck`

Expected: all automated checks pass before device testing.

- [ ] **Step 4: Verify on an iPhone using Expo Go**

Open Expo Go, scan the development QR code, submit a known lyric fragment, confirm ranked results render, play one preview, start a second preview to confirm the first stops, and test the Listen action.

- [ ] **Step 5: Verify Android internal-test distribution**

Build the Android App Bundle, upload it to the Play Console internal-test track, add a tester email, open the opt-in URL on a physical Android device, install from Google Play, and repeat the search/preview/handoff checks.

- [ ] **Step 6: Commit the delivery documentation**

```bash
git add app.json eas.json worker/.dev.vars.example worker/wrangler.jsonc README.md
git commit -m "docs: add testing and Android release guidance"
```

## Plan self-review

- **Spec coverage:** Tasks 2–3 cover secure licensed lyric lookup, validation, limited results, and safe errors. Task 4 covers the search and result interface, snippets, empty state, and accessibility. Task 5 covers one-at-a-time previews and platform-neutral listening handoff. Task 6 covers no-secret handling, Expo Go on iPhone, and Play internal testing on Android.
- **No placeholders:** This plan contains no unresolved work markers. Credentials are intentionally represented only by named environment variables; their values must be supplied from a licensed provider account at deployment.
- **Type consistency:** `SongResult` and `LyricsProvider.searchByLyrics()` are defined in Task 2 and consumed through the typed client/hooks/components in later tasks. The endpoint body is consistently `{ lyrics: string }` and response is consistently `{ results: SongResult[] }`.

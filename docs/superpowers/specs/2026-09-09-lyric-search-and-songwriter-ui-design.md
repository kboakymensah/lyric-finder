# Lyric Search and Songwriter UI Design

## Goal

Make Lyric Finder reliably identify songs from remembered lyric lines and present the results in a polished, songwriter-inspired Prototype 1 experience.

## Constraints

- Keep the Expo/React Native app and Cloudflare Worker architecture.
- Use no paid services, user accounts, API keys, or secrets.
- Do not use Genius. LRCLIB remains the lyric-search provider and iTunes Search remains the source for catalog metadata, artwork, preview URLs, and listening links.
- Keep `.env` out of version control.

## Search and Ranking

The Worker accepts a remembered lyric phrase and normalizes it into useful query variants without treating it as a song title. It requests LRCLIB with the original phrase and, when useful, a compact phrase variant. The Worker combines candidates, removes duplicate title-and-artist pairs, scores them by normalized lyric-token overlap, and returns the best matches in descending order.

Every retained match is enriched with iTunes metadata. A missing iTunes record must not remove a valid LRCLIB lyric match: the app still receives the title, artist, lyric snippet, and a web-search listening fallback. The response contains up to five results, with the first result being the best match.

## Results Experience

The home screen keeps lyric entry as the single primary action. After a successful search it renders:

- A prominent **Best match** card containing album cover, song title, artist, matching lyric snippet, and a 30-second preview action when available.
- A **More possible songs** list for the remaining ranked results, with cover art, artist/title, snippet, and platform-neutral Listen link.
- Explicit loading, no-results, malformed-response, and network-error states.

The visual system uses a near-black background, warm yellow highlights, and muted cream/gray text. Small music-note and lyric-sheet/pen motifs reinforce the songwriting theme without interfering with readability.

## Preview Playback

The app uses the existing Expo audio capability to play and pause an iTunes 30-second preview in place. Only one preview may play at a time. If a result has no preview URL, its preview control is omitted while its Listen link remains available.

## Testing and Verification

- Unit-test lyric normalization, candidate deduplication, scoring, and missing-catalog fallback behavior.
- Preserve existing validation and client timeout tests.
- Run TypeScript checks and all tests.
- Exercise the deployed Worker with a real remembered-lyrics query and verify it returns ranked title, artist, artwork, and preview fields when catalog data exists.

## Commit Checkpoints

1. `Improve lyric search ranking and result enrichment`
2. `Add black and yellow songwriter results experience`
3. `Add preview playback and search state coverage`

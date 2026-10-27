# Plain Lyrics Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display provider-supplied plain lyrics when synchronized lyrics are unavailable.

**Architecture:** Extend the existing Worker `/lyrics` response with nullable `plainLyrics`, pass it through `PreviewPlayerProvider`, and let `SyncedLyrics` render it as the fallback presentation in Now Playing and the full-lyrics sheet.

**Tech Stack:** React Native, Expo Router, Cloudflare Worker, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-plain-lyrics-fallback-design.md`

## Global Constraints

- Preserve the `/lyrics` request payload and timestamped-line behavior.
- Render only provider-returned lyric text.
- Add no dependencies or credentials.

## Review Focus

- A provider response with timed lines must continue to use the synchronized display.
- A provider response with plain lyrics but no timestamps must not show the unavailable message.
- A response with neither form must still show the unavailable state.

### Task 1: Worker lyric fallback contract

**Files:**
- Modify: `worker/src/lyrics.ts`
- Test: `worker/test/lyrics.test.ts`

- [ ] Write a failing test for a LRCLIB response containing `plainLyrics` but no `syncedLyrics`.
- [ ] Run `npm test -- worker/test/lyrics.test.ts` and confirm the fallback assertion fails.
- [ ] Return `plainLyrics` alongside `lines`, preserving the timestamp parser.
- [ ] Re-run the worker test and commit the worker change.

### Task 2: Now Playing fallback presentation

**Files:**
- Modify: `src/contexts/preview-player-context.tsx`
- Modify: `src/components/synced-lyrics.tsx`
- Modify: `src/components/playlist-preview-player.tsx`
- Test: `src/components/synced-lyrics.test.tsx`

- [ ] Write a failing component test for rendering a plain-lyrics fallback and a test that preserves the unavailable state for an empty response.
- [ ] Run `npm test -- src/components/synced-lyrics.test.tsx` and confirm the new fallback assertion fails.
- [ ] Carry `plainLyrics` from the Worker response into `SyncedLyrics`, and render the player lyrics section inline.
- [ ] Re-run component tests, then the full test suite and typecheck; commit the app change.

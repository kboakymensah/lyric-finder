# Lyric Finder Design

## Purpose

Lyric Finder helps someone identify a song when they remember only a few lyric lines. They enter a lyric fragment, receive likely matches, listen to a short preview, and can open a matching track in an available music service or a web result.

## Scope

The first release is a cross-platform mobile app built with React Native and Expo.

- iPhone users run it through Expo Go during development, without Apple Developer Program distribution.
- Android users receive a native Android App Bundle through Google Play internal testing.
- The release has no accounts, saved searches, social features, or permanent search history.

## Architecture

### Mobile app

The React Native/Expo app owns input, search state, results, audio-preview state, and external-link handling. It communicates only with the app backend and never contains a lyrics-provider API key.

### Search backend

A small backend provides one authenticated server-to-server integration:

`POST /search`

Request body:

```json
{ "lyrics": "a remembered lyric fragment" }
```

The backend validates the input, queries a licensed lyrics provider for lyric-text matches, normalizes and ranks the responses, and returns a bounded list of result objects. Provider credentials stay in server environment variables.

### Result model

Each result contains:

- unique identifier
- song title
- artist name
- artwork URL
- permitted matching-lyric snippet, if supplied
- preview-audio URL, if available
- platform-neutral listen URL, if available
- match score

The result source may combine a licensed lyrics search with music-catalog metadata so every result is rendered consistently.

## User experience

### Search

The home screen has a focused multi-line text field labelled “What lyrics do you remember?” and a Search action. The app requires a meaningful lyric fragment before sending a request; it shows inline guidance when the input is too short or empty.

### Results

During the request, the app shows a compact loading state. Results appear in rank order as cards containing cover art, song title, artist, and match confidence. A card can reveal a permitted lyric snippet.

Every result offers:

- a play/pause control for an approximately 30-second preview when available
- a platform-neutral “Listen” action when a link exists; it opens an available compatible music app when the operating system handles the link, otherwise it opens a web result for the exact song and artist

Starting a new preview stops the previous one. The Listen action uses an HTTPS URL rather than an Apple Music-specific deep link so the operating system can hand it to a compatible installed app when possible; otherwise it opens a web result for the track.

### Failure states

- Empty or too-short input: prompt for a few distinctive lyric words.
- No matches: recommend trying a shorter or different remembered line.
- Offline/network failure: ask the user to check the connection and retry.
- Provider failure: show a generic retry action without exposing provider or credential details.
- Missing preview: show the song result normally, with the Listen handoff when available.

## Privacy and safety

The app does not create user accounts or retain searches in version one. The backend uses lyric text only to execute the active request, applies rate limiting, and does not log raw lyric fragments beyond transient operational handling. It displays lyric snippets only when permitted by the selected licensed provider.

## Testing

- Unit tests: lyric-input validation, result mapping and ranking, and playback-state logic.
- App tests: successful search, no results, network/provider errors, preview play/pause, one-preview-at-a-time behavior, and external Listen handoff.
- Backend tests: invalid requests, provider timeouts/errors, malformed provider responses, normalization, and result limiting.
- Manual validation: run with Expo Go on an iPhone and install the Android build through a Google Play internal-testing opt-in link.

## Delivery

The Android build is uploaded to Google Play Console’s internal-test track and shared with invited tester email addresses. The iPhone development build runs via Expo Go. Production App Store or TestFlight distribution is explicitly out of scope because it requires Apple Developer Program membership.

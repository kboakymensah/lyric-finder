# Prototype 2: Library and Result Actions Design

## Goal

Extend Lyric Finder beyond a one-time lyric search. A user should be able to tell the difference between reading lyrics, previewing a song, and opening a full listening destination. They should also be able to save discovered songs and organize them into local playlists.

## Constraints

- Keep the existing Expo/React Native client and Cloudflare Worker lyric-search architecture.
- Do not add a paid service, account, or secret.
- Keep the existing Genius-backed lyric search and iTunes metadata/preview enrichment.
- Store the library on the device only. It is not synchronized between devices and may be removed when the app is deleted.
- Preserve the current black-and-yellow songwriting visual system.

## Result Actions

Each result card has separate, explicit actions:

- **View Lyrics** opens the matching song's Genius page in the browser.
- **Play Preview** starts or pauses the available in-app 30-second preview. This action appears only when a preview URL is available.
- **Listen** opens the full-song listening destination returned by the catalog provider, such as Apple Music or a web result.
- **Save** adds a song to Liked Songs; for a saved song the same control removes it from Liked Songs.

Genius does not provide a dependable public URL format for opening a lyrics page with exact lines highlighted. When the search provider returns a lyric snippet, the app displays that snippet in the result card as the reason for the match, then lets the user open the full Genius lyrics page separately.

## Local Library

The app adds a Library destination containing two sections:

1. **Liked Songs** lists all locally saved results with their artwork, title, and artist.
2. **Playlists** lists user-created, named playlists. A user can create a playlist, add one of their liked songs to it, remove a song from it, or delete the playlist.

A library item stores the song data required to render and act on it: stable ID, title, artist, artwork URL, Genius lyrics URL when available, preview URL, and listening URL. A playlist stores its ID, name, and the IDs of its saved songs. Duplicate saved songs and duplicate songs within a playlist are prevented.

The client loads this data from device storage at startup and writes it again after every save, remove, create, rename-free playlist edit, or deletion. If storage is unavailable or corrupt, the app presents an understandable message and continues with an empty in-memory library rather than breaking lyric search.

## Meaningful States and Transitions

| State | Cause | Next state |
| --- | --- | --- |
| Ready/editing lyrics | Home screen is open; user types | Searching or validation error |
| Searching | User submits a valid lyric query | Results, no results, or request error |
| Results | Worker returns one or more matches | Preview playing, lyrics opened, listening opened, or library saved |
| Preview playing | User taps Play Preview | Preview paused or a different preview playing |
| Library saved | User taps Save | Playlist editing or song removed from library |
| Playlist editing | User creates/selects a playlist and changes its songs | Library saved |
| No results/error | The Worker has no match or the request fails | Ready/editing lyrics after another attempt |

The new state required by Prototype 2 is the local library flow: a search result becomes a liked song and can then become an entry in a named playlist. This state persists after the app is reopened.

## Components and Data Flow

- Extend the shared song type with a dedicated `lyricsUrl`, so lyrics and listening destinations are never confused.
- Create a storage-focused library module that reads, validates, and writes saved songs and playlists.
- Add a small library state hook/provider that loads persisted data, exposes library actions, and lets result cards determine whether a song is saved.
- Update result cards to receive distinct callbacks for lyrics, preview, listening, and saving.
- Add a Library screen and navigation entry without altering the Worker search route.
- Update the Worker response to pass through Genius's song URL as `lyricsUrl` while retaining its current catalog `listenUrl` behavior.

## Error Handling

- A missing Genius URL hides or disables View Lyrics with a short explanation; it never redirects the user to an unrelated URL.
- A missing preview URL simply omits Play Preview.
- Failed external links display a readable in-app error rather than silently failing.
- Device-storage errors do not block lyric search; the user is told that saves could not be stored.
- The app handles an empty library and empty playlists with helpful prompts.

## Testing and Verification

- Unit-test library serialization, duplicate prevention, add/remove behavior, playlist creation/deletion, and playlist membership changes.
- Update result-card tests for distinct View Lyrics, Play Preview, Listen, and Save actions.
- Preserve client search, validation, timeout, preview, Worker ranking, and metadata tests.
- Run the full test suite and TypeScript check.
- Manually verify a lyric search, in-app preview, Genius lyrics handoff, local save, persistence after reload, and playlist membership on a device.

## Out of Scope

- User accounts, cloud sync, shared playlists, or backend library storage.
- Editing or highlighting text inside the Genius website.
- Full-length in-app music streaming.

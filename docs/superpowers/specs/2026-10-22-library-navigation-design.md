# Lyric Finder Library Navigation Design

## Purpose

Lyric Finder already lets people search from remembered lyrics, preview a song, open its lyrics, choose a listening platform, like it, favorite it, and organize it in playlists. Feedback shows that those capabilities are hard to discover because the library exposes too many controls at the same time. This iteration makes the everyday path easy to scan without removing existing functionality.

## Goals

- Make the main journey obvious: **Search → choose a result → Lyrics / Preview / Listen → Save → My Library**.
- Make saved music easy to find through separate, named collection views.
- Preserve existing saved data, playback queues, full lyrics, listening-platform picker, and playlist management.
- Use the supplied Apple Music screens as interaction inspiration only: dark collection lists, concise song rows, clear playback controls, and shallow navigation. Do not copy Apple branding, layouts, artwork, or assets.

## Navigation

### Search

The home screen remains the starting point. Its top area receives a prominent `My Library` navigation control. Search results retain all actions, but the action order is fixed as:

1. `Lyrics`
2. `Play Preview` / `Pause Preview`
3. `Listen on…`
4. Save and playlist tools

This makes listening and finding lyrics visible before secondary organization controls.

### My Library

The library landing view displays three collection rows/cards:

- **Liked Songs** — all saved songs.
- **Favorites** — liked songs that the person marked with a filled star.
- **Playlists** — user-created playlists.

Each row shows a count and opens its focused view. The landing view may show Recently Played as a compact section, but it must not mix editing controls into the three collection choices.

### Collection views

Liked Songs and Favorites each show:

- A back control to My Library.
- A large collection title and short explanation.
- `Play All` and `Shuffle` controls.
- Concise, tappable song rows; tapping a row starts its available preview.
- The favorite toggle, where relevant.

Playlists shows a separate list of playlists and a create control. Selecting a playlist opens its songs and its management tools (rename, delete, add/remove songs). Those tools do not appear on the library landing view.

## Player

The existing Now Playing screen remains the single destination for queue controls and the full in-app lyrics reader. It continues to show artwork, song/artist details, progress, previous/back/play/forward/next controls, playback mode, favorite, lyrics, and related songs. The redesign must not change preview availability or promise full-song playback when no licensed audio source exists.

## Data and Compatibility

- Existing AsyncStorage library data and recently played history remain in their current schemas.
- `LibraryContext` and `PreviewPlayerContext` public behavior remains compatible with the revised views.
- A song added to a playlist remains liked, as existing library behavior requires.

## Visual Rules

- Continue the app's own charcoal, warm-cream, and gold visual system.
- Use high-contrast text and descriptive accessibility labels.
- Prefer concise rows and grouped controls over long stacks of bordered cards.

## Error and Empty States

- Empty Liked Songs explains that search results can be saved into the library.
- Empty Favorites explains that the star adds a liked song to Favorites.
- Empty Playlists explains how to create a playlist.
- If a song has no preview, starting it displays the existing preview-unavailable message and does not crash or open a different screen.

## Acceptance Criteria

1. From search, people can clearly reach My Library and see Lyrics, Preview, and Listen actions before organization tools.
2. My Library exposes Liked Songs, Favorites, and Playlists as independent collection choices.
3. A person can open a collection, start a song, play all, shuffle, and return to the library landing screen.
4. Playlist create, rename, delete, and song membership controls remain functional in playlist-specific views.
5. Existing tests pass and the project type-checks on Expo SDK 58.

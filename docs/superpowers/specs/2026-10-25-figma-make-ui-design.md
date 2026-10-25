# Lyric Finder Figma Make UI Design

## Intent

Rebuild the native Lyric Finder presentation to closely follow the supplied Figma Make prototype: a music-app layout with black surfaces, large display headings, rich artwork, concise metadata, a compact player, and a four-item bottom bar. The goal is to make lyric search, saved songs, favorites, and playlists feel immediately recognizable rather than hiding them behind dense card stacks.

The reference is Apple Music-inspired, not Apple Music copied. Lyric Finder keeps its own name, its warm gold accent, its real search data, and only artwork returned by its existing catalog enrichment.

## Goals

- Match the prototype's information hierarchy on Search, My Library, Favorites, Playlists, and song/lyrics presentation.
- Make saved songs and favorites look like music collections: artwork-led rows and horizontal recently played items.
- Keep a persistent four-tab native bottom bar: Search, My Library, Favorites, Playlists.
- Preserve live lyric searching, LRCLIB/iTunes enrichment, Cloudflare Worker configuration, 30-second previews, lyrics, favorites, saved songs, and playlist behavior.
- Use native React Native views only; do not import or copy the web Figma Make export.

## Non-goals

- Do not use Apple logos, Apple Music branding, Apple artwork, or copied source code.
- Do not add streaming or pretend previews are full songs.
- Do not replace backend results with demo music data.
- Do not change AsyncStorage schemas, Expo configuration, EAS configuration, or API environment variables.

## Selected Approach

**Closest to the Figma Make prototype:** rebuild the existing screen composition and reusable native components while retaining the current contexts and search service.

An alternate approach—only applying Apple Music styling to the existing layouts—was rejected because it would not fix the prototype's clearer search-to-collection hierarchy. An exact Apple clone was rejected because it would copy another product's brand rather than Lyric Finder's identity.

## Screen Design

### Shared shell

- Black app background; dark-charcoal content panels; warm gold primary action/active state; white primary type; muted gray secondary type.
- Large, low-clutter screen headings with small uppercase gold eyebrow labels.
- Bottom tab bar is visually separate from content and has a gold active icon/label.
- The mini player sits directly above the tab bar and opens the existing full Now Playing sheet.
- All scrolling content reserves space for both elements and device safe areas.

### Search

- Small music-mark/`LYRIC FINDER` brand row.
- Large prompt: “What lyrics do you remember?” and supporting text.
- Explicit `Lyrics you remember` label, multi-line field, supportive text, `0/180` character counter, and a full-width gold `Find my song` button. The input has a native `maxLength` of 180 to match the prototype.
- Recent searches are compact, row-based, selectable, and removable.
- Search results remain real results; make each result more music-like with artwork, title/artist, lyric match, then Lyrics, Preview, Listen, Save/Favorite, and Playlist actions.

### My Library

- `My Library` title with a quick-return recently-found feature card when the most recently played real song exists; otherwise the feature card is omitted.
- `Recently played` uses horizontal artwork cards.
- `Saved songs` uses compact artwork rows and exposes the saved/favorite state.
- Navigation into all saved music, Favorites, and Playlists remains explicit.

### Favorites

- A header card summarizing favorite songs and a play-all control.
- Favorites appear as compact artwork rows; empty state tells the person how to favorite a song.

### Playlists

- Two-column artwork grid with names and song counts. A playlist tile uses its first real saved song's catalog artwork; empty playlists use a native gold music fallback rather than invented artwork.
- A prominent gold `New` control and `Create playlist` tile.
- Creating opens a native modal/bottom-sheet equivalent with name input, dismiss control, and disabled-until-valid create action.
- Playlist detail retains existing rename, delete, add, remove, and preview behavior.

### Song Details and lyrics

- Tapping a result or collection song opens a native Song Details screen modeled on the prototype: artwork, title/artist, Favorite, Save, and Playlist actions, plus a lyric excerpt/status.
- The screen uses only real result data. It labels unavailable lyrics or an excerpt explicitly and continues to offer the current external lyrics destination when full supplied lyrics are unavailable.
- Now Playing retains queue controls, full supported/synced lyrics, and the existing licensed preview behavior; it is opened from its mini player or a Song Details preview action.
- Favorite, Save, and Playlist actions update the current contexts immediately from Song Details.

## Architecture

- Continue using Expo Router routes and the current `LibraryProvider`/`PreviewPlayerProvider`.
- Use existing library records as the sole data source for saved songs, favorites, playlists, and recently played cards.
- Extract small native presentation components only where reuse prevents duplicated row/card/modal code.
- Routes remain Search (`/`), Library (`/explore`), Favorites (`/favorites`), and Playlists (`/playlists`), with a parameterized native Song Details route for real selected-song data.

## Acceptance Criteria

1. The four main screens visibly resemble the supplied Figma prototype's hierarchy on a phone-sized display.
2. Every collection is navigable from the persistent tab bar without obscuring scroll content or the mini player.
3. Search, recent-search reuse, live results, error/loading states, and externally opened lyrics/listening destinations remain functional.
4. A real search result or saved song can open Song Details with Favorite, Save, Playlist, preview, and lyric-status actions.
5. Saving, favoriting, playlist creation, membership updates, and previews update the existing library/player state immediately.
6. Tests, type checks, and an Expo iOS export pass.

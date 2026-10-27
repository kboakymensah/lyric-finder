# Plain Lyrics Fallback Design

## Intent

Show a song's available plain lyrics in Now Playing when the lyric provider has no timestamped lyrics, instead of incorrectly reporting that lyrics are unavailable.

## Approach

The Cloudflare Worker will retain its existing timestamped `lines` response and additionally return a nullable `plainLyrics` field from LRCLIB. The Expo player will prefer timed lines for synchronized display; when none exist, it will render the plain lyric text inline in Now Playing and in the full-lyrics sheet. The unavailable message remains only when neither form is supplied.

## Constraints

- Preserve the existing `/lyrics` request shape and timed-line behavior.
- Do not invent lyric text; render only content returned by the provider.
- Do not expose configuration or add dependencies.

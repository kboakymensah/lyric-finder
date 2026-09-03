# Known Bugs

- On the tested iPhone/Expo Go session, lyric searches return to the idle screen without displaying a result. The deployed Worker returns valid results from desktop verification; the device-side request/result path remains unresolved.
- LRCLIB full-text searches can return a cover version or an imperfect match.
- Preview URLs are returned by the backend but are not yet played in the mobile interface.

export const lyricInputLimit = 180;

// These are deliberately generic memory starters, not asserted song lyrics or
// popularity claims. A person can edit them into the words they remember.
export const lyricHookPrompts = [
  'oh oh oh, I remember',
  'na na na, baby',
  'I remember when',
] as const;

export const searchScreenCopy = {
  inputLabel: 'Lyrics you remember',
  helper: 'Any words can help',
  submit: 'Find my song',
} as const;

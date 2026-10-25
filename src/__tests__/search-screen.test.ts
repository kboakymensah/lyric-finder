import { describe, expect, it } from 'vitest';

import { lyricInputLimit, searchScreenCopy } from '../lib/search-screen';

describe('Figma-inspired lyric search copy', () => {
  it('keeps the prototype input guidance and 180 character limit', () => {
    expect(lyricInputLimit).toBe(180);
    expect(searchScreenCopy.inputLabel).toBe('Lyrics you remember');
    expect(searchScreenCopy.helper).toBe('Any words can help');
    expect(searchScreenCopy.submit).toBe('Find my song');
  });
});

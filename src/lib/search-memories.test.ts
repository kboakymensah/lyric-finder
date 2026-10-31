import { describe, expect, it } from 'vitest';

import { addSearchMemory, parseSearchMemories } from './search-memories';

describe('search memories', () => {
  it('keeps the location attached to the lyric search that prompted it', () => {
    expect(addSearchMemory([], 'I remember when', 'Walking in the park')).toEqual([
      { query: 'I remember when', place: 'Walking in the park' },
    ]);
  });

  it('replaces an older memory for the same lyric search', () => {
    expect(addSearchMemory(
      [{ query: 'I remember when', place: 'The park' }],
      'i remember when',
      'A late-night drive',
    )).toEqual([{ query: 'i remember when', place: 'A late-night drive' }]);
  });

  it('rejects malformed stored data', () => {
    expect(parseSearchMemories('{not json}')).toEqual([]);
  });
});

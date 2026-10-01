import { describe, expect, it } from 'vitest';

import { addRecentSearch, parseRecentSearches, removeRecentSearch } from './recent-searches';

describe('recent searches', () => {
  it('adds a trimmed search to the front and removes duplicates', () => {
    expect(addRecentSearch(['older line', 'hello'], '  Hello  ')).toEqual(['Hello', 'older line']);
  });

  it('limits saved searches and removes one selected search', () => {
    const searches = Array.from({ length: 8 }, (_, index) => `line ${index}`);
    expect(addRecentSearch(searches, 'new line')).toHaveLength(8);
    expect(removeRecentSearch(['first', 'second'], 'first')).toEqual(['second']);
  });

  it('parses only valid saved search text', () => {
    expect(parseRecentSearches('["one", 3, " two "]')).toEqual(['one', 'two']);
    expect(parseRecentSearches('not json')).toEqual([]);
  });
});

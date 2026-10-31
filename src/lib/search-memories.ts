const MAX_SEARCH_MEMORIES = 8;

export type SearchMemory = { query: string; place: string };

export function parseSearchMemories(stored: string): SearchMemory[] {
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is SearchMemory => Boolean(item) && typeof item.query === 'string' && typeof item.place === 'string')
      .map(({ query, place }) => ({ query: query.trim(), place: place.trim() }))
      .filter(({ query, place }) => Boolean(query && place))
      .slice(0, MAX_SEARCH_MEMORIES);
  } catch {
    return [];
  }
}

export function addSearchMemory(memories: SearchMemory[], query: string, place: string): SearchMemory[] {
  const next = { query: query.trim(), place: place.trim() };
  if (!next.query || !next.place) return memories;

  return [next, ...memories.filter((memory) => memory.query.toLocaleLowerCase() !== next.query.toLocaleLowerCase())]
    .slice(0, MAX_SEARCH_MEMORIES);
}

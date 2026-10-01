const MAX_RECENT_SEARCHES = 8;

export function parseRecentSearches(stored: string): string[] {
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function addRecentSearch(searches: string[], search: string): string[] {
  const trimmed = search.trim();
  if (!trimmed) return searches;
  return [trimmed, ...searches.filter((item) => item.toLocaleLowerCase() !== trimmed.toLocaleLowerCase())].slice(0, MAX_RECENT_SEARCHES);
}

export function removeRecentSearch(searches: string[], search: string): string[] {
  return searches.filter((item) => item !== search);
}

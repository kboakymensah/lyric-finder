export type BottomNavigationVisibility = 'collapsed' | 'expanded';

export const bottomNavigationEvent = 'lyric-finder:bottom-navigation';

/** Keeps navigation compact after normal downward scrolling, while leaving its icons reachable. */
export function bottomNavigationVisibilityForScroll(currentOffset: number, previousOffset: number): BottomNavigationVisibility | null {
  const compactOffset = 48;
  if (currentOffset <= 4) return 'expanded';
  if (currentOffset >= compactOffset && currentOffset > previousOffset) return 'collapsed';
  if (currentOffset < previousOffset) return 'expanded';
  return null;
}

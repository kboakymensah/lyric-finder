export type BottomNavigationVisibility = 'collapsed' | 'expanded';

export const bottomNavigationEvent = 'lyric-finder:bottom-navigation';

/** Collapses only after a meaningful downward scroll, leaving the compact icon row reachable. */
export function bottomNavigationVisibilityForScroll(currentOffset: number, previousOffset: number): BottomNavigationVisibility | null {
  if (currentOffset <= 4) return 'expanded';
  if (currentOffset - previousOffset > 12) return 'collapsed';
  if (previousOffset - currentOffset > 12) return 'expanded';
  return null;
}

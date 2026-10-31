import { describe, expect, it } from 'vitest';

import { bottomNavigationVisibilityForScroll } from './bottom-navigation-scroll';

describe('bottomNavigationVisibilityForScroll', () => {
  it('collapses the bar when a screen is scrolling down', () => {
    expect(bottomNavigationVisibilityForScroll(220, 180)).toBe('collapsed');
  });

  it('expands the bar when a screen is scrolling back up', () => {
    expect(bottomNavigationVisibilityForScroll(160, 220)).toBe('expanded');
  });

  it('keeps the bar expanded at the top of a screen', () => {
    expect(bottomNavigationVisibilityForScroll(0, 120)).toBe('expanded');
  });
});

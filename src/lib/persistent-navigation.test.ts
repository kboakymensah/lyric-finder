import { describe, expect, it } from 'vitest';

import { persistentNavigationSurfaceStyle } from './persistent-navigation';

describe('persistentNavigationSurfaceStyle', () => {
  it('keeps the app navigation above scrollable screen content on iOS and Android', () => {
    expect(persistentNavigationSurfaceStyle).toMatchObject({
      bottom: 0,
      elevation: 24,
      left: 0,
      position: 'absolute',
      right: 0,
      zIndex: 24,
    });
  });
});

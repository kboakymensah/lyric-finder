import { describe, expect, it } from 'vitest';

import { mainNavigationItems } from '../lib/main-navigation';

describe('main navigation', () => {
  it('keeps the four primary destinations available from every main screen', () => {
    expect(mainNavigationItems).toEqual([
      { id: 'search', label: 'Search', href: '/' },
      { id: 'library', label: 'My Library', href: '/explore' },
      { id: 'favorites', label: 'Favorites', href: '/explore?view=favorites' },
      { id: 'playlists', label: 'Playlists', href: '/explore?view=playlists' },
    ]);
  });
});

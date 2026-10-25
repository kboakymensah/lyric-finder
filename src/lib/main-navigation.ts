export const mainNavigationItems = [
  { id: 'search', label: 'Search', href: '/' },
  { id: 'library', label: 'My Library', href: '/explore' },
  { id: 'favorites', label: 'Favorites', href: '/explore?view=favorites' },
  { id: 'playlists', label: 'Playlists', href: '/explore?view=playlists' },
] as const;

export const searchHeaderNavigation = { label: 'My Library', href: '/explore' } as const;

export type MainNavigationId = (typeof mainNavigationItems)[number]['id'];

import { describe, expect, it } from 'vitest';

import { searchHeaderNavigation } from '../lib/main-navigation';

describe('search screen navigation', () => {
  it('offers a direct library entry point without changing the search action', () => {
    expect(searchHeaderNavigation).toEqual({ label: 'My Library', href: '/explore' });
  });
});

import { describe, expect, it } from 'vitest';

import { validateLyrics } from '../lib/validation';

describe('validateLyrics', () => {
  it('requires at least eight non-whitespace characters', () => {
    expect(validateLyrics('  hello  ')).toBe('Enter at least a few lyric words.');
    expect(validateLyrics('hello from the other side')).toBeNull();
  });
});

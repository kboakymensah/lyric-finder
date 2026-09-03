import { describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout } from '../lib/request';

describe('fetchWithTimeout', () => {
  it('rejects a request that does not settle before the timeout', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(() => new Promise<Response>(() => {}));
    const request = fetchWithTimeout('https://example.test/search', {}, 5, fetcher as typeof fetch);

    const expectation = expect(request).rejects.toThrow('Search timed out. Please try again.');
    await vi.advanceTimersByTimeAsync(5);
    await expectation;
    vi.useRealTimers();
  });
});

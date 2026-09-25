import { describe, expect, it, vi } from 'vitest';

import app from '../src';
import { lookupSyncedLyrics } from '../src/lyrics';

describe('lookupSyncedLyrics', () => {
  it('returns parsed timed lines from LRCLIB', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ syncedLyrics: '[00:01.50]Hello\n[00:10.00]World' })));
    await expect(lookupSyncedLyrics('Hello', 'Adele', fetcher as typeof fetch)).resolves.toEqual({
      lines: [{ timeSeconds: 1.5, text: 'Hello' }, { timeSeconds: 10, text: 'World' }],
    });
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/api/get' }), expect.any(Object));
  });

  it('returns no lines when LRCLIB has no synced lyrics or fails', async () => {
    await expect(lookupSyncedLyrics('Hello', 'Adele', async () => new Response(JSON.stringify({})) as Response)).resolves.toEqual({ lines: [] });
    await expect(lookupSyncedLyrics('Hello', 'Adele', async () => new Response('', { status: 503 }) as Response)).resolves.toEqual({ lines: [] });
  });
});

describe('POST /lyrics', () => {
  it('rejects invalid song details', async () => {
    const response = await app.request('/lyrics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '', artist: 'Adele' }) });
    expect(response.status).toBe(400);
  });
});

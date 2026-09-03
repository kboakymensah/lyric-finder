import { Hono } from 'hono';
import { searchSongs } from './search';

const app = new Hono();
app.post('/search', async (c) => {
  const body: { lyrics?: string } = await c.req.json<{ lyrics?: string }>().catch(() => ({}));
  const lyrics = body.lyrics?.trim() ?? '';
  if (lyrics.length < 8 || lyrics.length > 500) return c.json({ error: 'Enter at least a few lyric words.' }, 400);
  try { return c.json({ results: await searchSongs(lyrics) }); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : 'Search is temporarily unavailable.' }, 502); }
});
export default app;

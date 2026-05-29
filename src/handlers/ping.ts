import type { Context } from 'hono';

/**
 * GET /ping - Health check endpoint
 */
export function ping(c: Context): Response {
  return c.json({ message: 'pong' });
}

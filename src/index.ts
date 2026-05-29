import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { logger } from './middleware/logger';
import { authRequired, handleLogin, handleLogout } from './middleware/auth';

// Handlers
import { pageHome, pageSearch, pageApplications, pageBookmarks, pageHelp } from './handlers/home';
import {
  pageTheme, saveTheme,
  pageSearch as pageSearchSettings, saveSearch,
  pageAppearance, saveAppearance,
  pageOthers,
} from './handlers/settings';
import { pageEditor, saveEditor } from './handlers/editor';
import { redirHome, redirURL } from './handlers/redir';
import { ping } from './handlers/ping';
import { exportToml, downloadTomlFile, importToml, importForm } from './handlers/toml-io';

type Bindings = { DB: D1Database; ASSETS?: { fetch: (req: Request) => Promise<Response> } };

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger);

// -- Health check --------------------------------------------------------------
app.get('/ping', ping);

// -- Home page routes ----------------------------------------------------------
// When visibility is PRIVATE, all pages require authentication
const visibilityGate: MiddlewareHandler = async (c, next) => {
  if (c.env?.VISIBILITY === 'PRIVATE') return authRequired(c, next);
  return next();
};
app.get('/', visibilityGate, pageHome);
app.post('/', visibilityGate, pageSearch);
app.get('/help', visibilityGate, pageHelp);
app.get('/applications', visibilityGate, pageApplications);
app.get('/bookmarks', visibilityGate, pageBookmarks);

// -- Settings routes (auth required) -------------------------------------------
app.get('/settings', (c) => c.redirect('/settings/theme'));

app.get('/settings/theme', authRequired, pageTheme);
app.post('/settings/theme', authRequired, saveTheme);

app.get('/settings/search', authRequired, pageSearchSettings);
app.post('/settings/search', authRequired, saveSearch);

app.get('/settings/appearance', authRequired, pageAppearance);
app.post('/settings/appearance', authRequired, saveAppearance);

app.get('/settings/application', pageOthers);

// -- Auth routes ---------------------------------------------------------------
app.post('/login', handleLogin);
app.post('/logout', handleLogout);

// -- Editor routes (auth required) ---------------------------------------------
app.get('/editor', authRequired, pageEditor);
app.post('/editor', authRequired, saveEditor);

// -- Redirect routes -----------------------------------------------------------
app.get('/redir', redirHome);
app.get('/redir/url', redirURL);

// -- TOML import/export API ----------------------------------------------------
app.get('/api/config/export', authRequired, exportToml);
app.get('/api/config/export/download', authRequired, downloadTomlFile);
app.get('/api/config/import', authRequired, importForm);
app.post('/api/config/import', authRequired, importToml);

// -- MDI Icon cheat-sheet ------------------------------------------------------
// Served from public/icons/ via Cloudflare Assets
app.get('/icons', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/icons/index.html';
  // Try to serve from the ASSETS binding (available when [assets] is configured)
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
  }
  return c.redirect('/icons/index.html');
});

// Fallback for unmatched routes: serve static assets if available
app.notFound(async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;

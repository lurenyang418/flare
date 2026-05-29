import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getSettings, updateSettings, getLinksByType, getCategories, updateLinks, updateCategories } from '../db/schema';
import {
  importConfigToml,
  importAppsToml,
  importBookmarksToml,
  exportConfigToml,
  exportAppsToml,
  exportBookmarksToml,
} from '../services/toml';

/**
 * GET /api/config/export - Export all data as TOML
 */
export async function exportToml(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = await getSettings(db);
  const apps = await getLinksByType(db, 'app');
  const bookmarks = await getLinksByType(db, 'bookmark');
  const categories = await getCategories(db);

  const result = {
    'config.toml': exportConfigToml(settings!),
    'apps.toml': exportAppsToml(apps),
    'bookmarks.toml': exportBookmarksToml(categories, bookmarks),
  };

  return c.json(result);
}

/**
 * GET /api/config/export/download - Download a single TOML file
 */
export async function downloadTomlFile(c: Context): Promise<Response> {
  const file = c.req.query('file');
  const db = getDB(c);
  const settings = await getSettings(db);
  const apps = await getLinksByType(db, 'app');
  const bookmarks = await getLinksByType(db, 'bookmark');
  const categories = await getCategories(db);

  let content = '';
  switch (file) {
    case 'config':
      content = exportConfigToml(settings!);
      break;
    case 'apps':
      content = exportAppsToml(apps);
      break;
    case 'bookmarks':
      content = exportBookmarksToml(categories, bookmarks);
      break;
    default:
      return c.text('Invalid file parameter. Use: config, apps, or bookmarks', 400);
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'application/toml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}.toml"`,
    },
  });
}

/**
 * POST /api/config/import - Import TOML data into D1
 */
export async function importToml(c: Context): Promise<Response> {
  const db = getDB(c);
  const body = await c.req.parseBody<{ config?: string | File; apps?: string | File; bookmarks?: string | File }>();

  const results: string[] = [];

  if (body.config) {
    try {
      const raw = typeof body.config === 'string' ? body.config : await (body.config as File).text();
      const config = importConfigToml(raw);
      await updateSettings(db, config);
      results.push('config.toml imported successfully');
    } catch (e: any) {
      results.push(`config.toml import failed: ${e.message}`);
    }
  }

  if (body.apps) {
    try {
      const raw = typeof body.apps === 'string' ? body.apps : await (body.apps as File).text();
      const apps = importAppsToml(raw);
      const existingBookmarks = await getLinksByType(db, 'bookmark');
      await updateLinks(db, [...apps, ...existingBookmarks]);
      results.push(`apps.toml imported: ${apps.length} links`);
    } catch (e: any) {
      results.push(`apps.toml import failed: ${e.message}`);
    }
  }

  if (body.bookmarks) {
    try {
      const raw = typeof body.bookmarks === 'string' ? body.bookmarks : await (body.bookmarks as File).text();
      const { categories, links } = importBookmarksToml(raw);
      const existingApps = await getLinksByType(db, 'app');
      await updateCategories(db, categories);
      await updateLinks(db, [...existingApps, ...links]);
      results.push(`bookmarks.toml imported: ${categories.length} categories, ${links.length} links`);
    } catch (e: any) {
      results.push(`bookmarks.toml import failed: ${e.message}`);
    }
  }

  if (results.length === 0) {
    return c.text('No files provided. Upload config, apps, and/or bookmarks.', 400);
  }

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Import Results</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 60px auto; background: #1a1a1a; color: #FFFDEA; }
    h1 { margin-bottom: 20px; }
    li { padding: 4px 0; }
    .ok { color: #98c379; }
    .fail { color: #e06c75; }
    a { color: #5c5c5c; }
  </style>
</head>
<body>
  <h1>Import Results</h1>
  <ul>${results.map((r) => `<li class="${r.includes('failed') ? 'fail' : 'ok'}">${r}</li>`).join('')}</ul>
  <p><a href="/api/config/import">← 继续导入</a></p>
  <p><a href="/">Return Home</a></p>
</body>
</html>`);
}

/**
 * GET /api/config/import - Show import form
 */
export function importForm(c: Context): Response {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Import TOML Data</title>
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/settings/layout.css">
  <link rel="stylesheet" href="/assets/css/settings/sidebar.css">
  <style>
    .import-page { max-width: 520px; margin: 60px auto; }
    .import-page h1 { margin-bottom: 24px; font-size: 24px; color: var(--color-primary); }
    .import-page .form-group { margin-bottom: 20px; }
    .import-page .form-group label { display: block; margin-bottom: 6px; color: var(--color-primary); }
    .import-page .form-group input[type=file] {
      display: block; width: 100%; padding: 10px; border-radius: 4px;
      background: var(--color-primary); color: var(--color-background); border: none;
    }
    .import-page .btn-submit {
      padding: 10px 24px; border: 1px solid var(--color-accent);
      background: var(--color-background); color: var(--color-primary);
      border-radius: 4px; cursor: pointer; font-size: 14px;
    }
    .import-page .back-link { margin-top: 24px; }
    .import-page .back-link a { color: var(--color-accent); }
  </style>
</head>
<body style="--color-background:#1a1a1a;--color-primary:#FFFDEA;--color-accent:#5c5c5c;">
  <div class="import-page">
    <h1>Import TOML Data</h1>
    <form method="POST" action="/api/config/import" enctype="multipart/form-data">
      <div class="form-group">
        <label for="f-config">config.toml</label>
        <input id="f-config" type="file" name="config" accept=".toml" />
      </div>
      <div class="form-group">
        <label for="f-apps">apps.toml</label>
        <input id="f-apps" type="file" name="apps" accept=".toml" />
      </div>
      <div class="form-group">
        <label for="f-bookmarks">bookmarks.toml</label>
        <input id="f-bookmarks" type="file" name="bookmarks" accept=".toml" />
      </div>
      <button class="btn-submit" type="submit">Import</button>
    </form>
    <p class="back-link"><a href="/settings/application">← 返回设置</a></p>
  </div>
</body>
</html>`);
}

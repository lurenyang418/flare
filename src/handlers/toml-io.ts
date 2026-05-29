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
      const tomlStr = typeof body.config === 'string' ? body.config : await (body.config as File).text();
      const config = importConfigToml(tomlStr);
      await updateSettings(db, config);
      results.push('config.toml imported successfully');
    } catch (e: any) {
      results.push(`config.toml import failed: ${e.message}`);
    }
  }

  if (body.apps) {
    try {
      const tomlStr = typeof body.apps === 'string' ? body.apps : await (body.apps as File).text();
      const apps = importAppsToml(tomlStr);
      const existingBookmarks = await getLinksByType(db, 'bookmark');
      await updateLinks(db, [...apps, ...existingBookmarks]);
      results.push(`apps.toml imported: ${apps.length} apps`);
    } catch (e: any) {
      results.push(`apps.toml import failed: ${e.message}`);
    }
  }

  if (body.bookmarks) {
    try {
      const tomlStr = typeof body.bookmarks === 'string' ? body.bookmarks : await (body.bookmarks as File).text();
      const { categories, links } = importBookmarksToml(tomlStr);
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

  return c.html(`<html>
    <head><meta charset="UTF-8"><title>Import Results</title></head>
    <body>
      <h1>Import Results</h1>
      <ul>${results.map((r) => `<li>${r}</li>`).join('')}</ul>
      <p><a href="/">Return Home</a></p>
    </body>
  </html>`);
}

/**
 * GET /api/config/import - Show import form
 */
export function importForm(c: Context): Response {
  return c.html(`<html>
    <head><meta charset="UTF-8"><title>Import TOML Data</title>
    <style>body { font-family: sans-serif; max-width: 600px; margin: 40px auto; } label { display: block; margin: 10px 0; }</style>
    </head>
    <body>
      <h1>Import TOML Data</h1>
      <form method="POST" action="/api/config/import" enctype="multipart/form-data">
        <label>config.toml: <input type="file" name="config" accept=".toml" /></label>
        <label>apps.toml: <input type="file" name="apps" accept=".toml" /></label>
        <label>bookmarks.toml: <input type="file" name="bookmarks" accept=".toml" /></label>
        <button type="submit">Import</button>
      </form>
      <p><a href="/">Return Home</a></p>
    </body>
  </html>`);
}

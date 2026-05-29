import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getSettings, getLinksByType, getCategories, updateLinks, updateCategories } from '../db/schema';
import { getThemeBodyStyle } from '../utils/themes';
import { renderEditorPage } from '../services/renderer';
import type { Bookmark, Category } from '../types/models';

/**
 * GET /editor - Show the Handsontable-based editor
 */
export async function pageEditor(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const apps = await getLinksByType(db, 'app');
  const bookmarks = await getLinksByType(db, 'bookmark');
  const categories = await getCategories(db);

  const html = renderEditorPage(categories, bookmarks, apps, {
    bodyStyle: getThemeBodyStyle(settings.Theme),
    optionTitle: settings.Title,
  });

  return c.html(html);
}

/**
 * POST /editor - Save editor data (CSV format)
 */
export async function saveEditor(c: Context): Promise<Response> {
  const db = getDB(c);
  const body = await c.req.parseBody<{ categories?: string; bookmarks?: string }>();

  const categoriesCSV = body.categories ?? '';
  const bookmarksCSV = body.bookmarks ?? '';

  // Parse categories CSV: ID,Name
  const catRows = categoriesCSV.split('\n').filter((r) => r.trim());
  const categories: Category[] = catRows.map((row, i) => {
    const cols = row.split(',');
    return {
      id: cols[0]?.trim() ?? String(i),
      type: 'bookmark',
      title: cols[1]?.trim() ?? '',
      sort_order: i,
    };
  });

  // Parse bookmarks CSV: Name,URL,Category,Icon,Desc
  const bmRows = bookmarksCSV.split('\n').filter((r) => r.trim());
  const links: Bookmark[] = bmRows.map((row, i) => {
    const cols = row.split(',');
    const categoryId = cols[2]?.trim() ?? '';
    const isApp = categoryId === '_FLARE_FIXED_CATEGORY' || categoryId === '';
    return {
      type: isApp ? 'app' : 'bookmark',
      name: cols[0]?.trim() ?? '',
      url: cols[1]?.trim() ?? '',
      category_id: isApp ? null : (categoryId || null),
      icon: cols[3]?.trim() ?? '',
      desc: cols[4]?.trim() ?? '',
      private: 0,
      sort_order: i,
    };
  });

  await updateCategories(db, categories);
  await updateLinks(db, links);

  return c.redirect('/editor');
}

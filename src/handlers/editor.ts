import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getSettings, getLinksByType, getCategories, replaceEditorData } from '../db/schema';
import { getThemeBodyStyle } from '../utils/themes';
import { renderEditorPage } from '../services/renderer';
import type { Bookmark, Category } from '../types/models';

const FIXED_APP_CATEGORY = '[Flare 应用]';
const LEGACY_FIXED_APP_CATEGORY = '_FLARE_FIXED_CATEGORY';

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

  try {
    const categories = parseCategories(body.categories ?? '');
    const links = parseLinks(body.bookmarks ?? '', categories);
    await replaceEditorData(db, categories, links);
    return c.redirect('/editor');
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return c.text(`无法保存编辑器数据：${message}`, 400);
  }
}

function parseCategories(input: string): Category[] {
  const rows = parseCSV(input).filter(hasContent);
  const seenIds = new Set<string>();

  return rows.flatMap((row, index) => {
    const id = row[0]?.trim() ?? '';
    const title = row[1]?.trim() ?? '';
    if (!id || !title) return [];
    if (seenIds.has(id)) {
      throw new Error(`分类 ID 重复：${id}`);
    }
    seenIds.add(id);
    return [{
      id,
      type: 'bookmark',
      title,
      sort_order: index,
    }];
  });
}

function parseLinks(input: string, categories: Category[]): Bookmark[] {
  const categoryIdsByTitle = new Map(categories.map((category) => [category.title, category.id]));
  const categoryIds = new Set(categories.map((category) => category.id));
  let appOrder = 0;
  let bookmarkOrder = 0;

  return parseCSV(input).filter(hasContent).flatMap((row) => {
    // Handsontable's ExportFile plugin adds a row-header column. Keep accepting
    // the earlier Workers editor format, which submitted only the five data columns.
    const offset = row.length >= 6 ? 1 : 0;
    const name = row[offset]?.trim() ?? '';
    const url = row[offset + 1]?.trim() ?? '';
    const categoryTitle = row[offset + 2]?.trim() ?? '';
    const icon = row[offset + 3]?.trim() ?? '';
    const desc = row[offset + 4]?.trim() ?? '';
    if (!name || !url) return [];

    const isApp =
      categoryTitle === FIXED_APP_CATEGORY ||
      categoryTitle === LEGACY_FIXED_APP_CATEGORY ||
      categoryTitle === '';
    const categoryId = isApp
      ? null
      : categoryIdsByTitle.get(categoryTitle) ??
        (categoryIds.has(categoryTitle) ? categoryTitle : undefined);
    if (!isApp && !categoryId) {
      throw new Error(`书签“${name}”引用了不存在的分类“${categoryTitle}”`);
    }

    return [{
      type: isApp ? 'app' : 'bookmark',
      name,
      url,
      category_id: categoryId ?? null,
      icon,
      desc,
      private: 0,
      sort_order: isApp ? appOrder++ : bookmarkOrder++,
    }];
  });
}

function hasContent(row: string[]): boolean {
  return row.some((cell) => cell.trim() !== '');
}

function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"' && value.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      if (char === '\r' && input[index + 1] === '\n') index++;
    } else {
      value += char;
    }
  }

  if (quoted) {
    throw new Error('CSV 中存在未闭合的引号');
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

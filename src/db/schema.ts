import type { D1Database } from '@cloudflare/workers-types';
import type { Application, Bookmark, Category } from '../types/models';

// -- Settings -----------------------------------------------------------------

export function getSettings(db: D1Database): Promise<Application | null> {
  return db
    .prepare('SELECT data_json FROM settings ORDER BY id DESC LIMIT 1')
    .first<{ data_json: string }>()
    .then((row) => (row ? JSON.parse(row.data_json) : null));
}

export async function updateSettings(db: D1Database, data: Application): Promise<D1Result> {
  // Try UPDATE first; if no row exists, INSERT
  const result = await db
    .prepare('UPDATE settings SET data_json = ?, updated_at = datetime(\'now\') WHERE id = (SELECT id FROM settings ORDER BY id DESC LIMIT 1)')
    .bind(JSON.stringify(data))
    .run();
  if (result.meta && (result.meta as any).changes === 0) {
    return db
      .prepare('INSERT INTO settings (data_json) VALUES (?)')
      .bind(JSON.stringify(data))
      .run();
  }
  return result;
}

// -- Categories ---------------------------------------------------------------

export function getCategories(db: D1Database, type: string = 'bookmark'): Promise<Category[]> {
  return db
    .prepare('SELECT id, type, title, sort_order FROM categories WHERE type = ? ORDER BY sort_order ASC')
    .bind(type)
    .all<Category>()
    .then((r) => r.results);
}

export function getAllCategories(db: D1Database): Promise<Category[]> {
  return db
    .prepare('SELECT id, type, title, sort_order FROM categories ORDER BY type, sort_order ASC')
    .all<Category>()
    .then((r) => r.results);
}

export function updateCategories(db: D1Database, categories: Category[]): Promise<void> {
  const del = db.prepare('DELETE FROM categories');
  const insert = db.prepare(
    'INSERT INTO categories (id, type, title, sort_order) VALUES (?, ?, ?, ?)'
  );
  const stmts = [del, ...categories.map((c, i) => insert.bind(c.id, c.type, c.title, c.sort_order ?? i))];
  return db.batch(stmts).then(() => undefined);
}

// -- Links --------------------------------------------------------------------

export function getLinksByType(db: D1Database, type: 'app' | 'bookmark'): Promise<Bookmark[]> {
  return db
    .prepare('SELECT id, type, name, url, icon, desc, private, category_id, sort_order FROM links WHERE type = ? ORDER BY sort_order ASC')
    .bind(type)
    .all<Bookmark>()
    .then((r) => r.results);
}

export function getAllLinks(db: D1Database): Promise<Bookmark[]> {
  return db
    .prepare('SELECT id, type, name, url, icon, desc, private, category_id, sort_order FROM links ORDER BY type, sort_order ASC')
    .all<Bookmark>()
    .then((r) => r.results);
}

export function searchLinks(db: D1Database, query: string): Promise<Bookmark[]> {
  const pattern = `%${query}%`;
  return db
    .prepare('SELECT id, type, name, url, icon, desc, private, category_id, sort_order FROM links WHERE name LIKE ? OR url LIKE ? OR desc LIKE ? ORDER BY type, sort_order ASC')
    .bind(pattern, pattern, pattern)
    .all<Bookmark>()
    .then((r) => r.results);
}

export function findLinkByUrl(db: D1Database, url: string): Promise<Bookmark | null> {
  return db
    .prepare('SELECT id, type, name, url, icon, desc, private, category_id, sort_order FROM links WHERE url = ? LIMIT 1')
    .bind(url)
    .first<Bookmark>()
    .then((r) => r ?? null);
}

export function updateLinks(db: D1Database, links: Bookmark[]): Promise<void> {
  const del = db.prepare("DELETE FROM links");
  const insert = db.prepare(
    'INSERT INTO links (type, name, url, icon, desc, private, category_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const stmts = [del, ...links.map((l, i) =>
    insert.bind(l.type, l.name, l.url, l.icon, l.desc ?? '', l.private ? 1 : 0, l.category_id ?? null, l.sort_order ?? i)
  )];
  return db.batch(stmts).then(() => undefined);
}

export function replaceEditorData(
  db: D1Database,
  categories: Category[],
  links: Bookmark[]
): Promise<void> {
  const insertCategory = db.prepare(
    'INSERT INTO categories (id, type, title, sort_order) VALUES (?, ?, ?, ?)'
  );
  const insertLink = db.prepare(
    'INSERT INTO links (type, name, url, icon, desc, private, category_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const stmts = [
    db.prepare('DELETE FROM links'),
    db.prepare('DELETE FROM categories'),
    ...categories.map((category, index) =>
      insertCategory.bind(
        category.id,
        category.type,
        category.title,
        category.sort_order ?? index
      )
    ),
    ...links.map((link, index) =>
      insertLink.bind(
        link.type,
        link.name,
        link.url,
        link.icon,
        link.desc ?? '',
        link.private ? 1 : 0,
        link.category_id ?? null,
        link.sort_order ?? index
      )
    ),
  ];

  return db.batch(stmts).then(() => undefined);
}

// -- Metadata -----------------------------------------------------------------

export function getMetadata(db: D1Database, key: string): Promise<string | null> {
  return db
    .prepare('SELECT value FROM metadata WHERE key = ?')
    .bind(key)
    .first<{ value: string }>()
    .then((r) => r?.value ?? null);
}

export function setMetadata(db: D1Database, key: string, value: string): Promise<D1Result> {
  return db
    .prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)')
    .bind(key, value)
    .run();
}

// Types for D1 results
interface D1Result {
  success: boolean;
  meta?: object;
}

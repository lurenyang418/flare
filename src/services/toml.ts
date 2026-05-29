import { parse, stringify } from 'smol-toml';
import type { Application, Bookmark, Category } from '../types/models';

// -- Types for TOML file formats -----------------------------------------------

interface AppsToml {
  links: Array<{
    name: string;
    link: string;
    icon?: string;
    desc?: string;
  }>;
}

interface BookmarksToml {
  categories?: Array<{
    id: string;
    title: string;
  }>;
  links: Array<{
    name: string;
    link: string;
    icon?: string;
    desc?: string;
    private?: boolean;
    category?: string;
  }>;
}

// -- Import: TOML → D1 format --------------------------------------------------

export function importConfigToml(tomlStr: string): Application {
  const parsed = parse(tomlStr) as unknown as Partial<Application>;
  return {
    Title: parsed.Title ?? 'flare',
    Footer: parsed.Footer ?? '由 <a href="https://github.com/lurenyang418/flare">Flare</a> ❤️ 强力驱动',
    OpenAppNewTab: parsed.OpenAppNewTab ?? true,
    OpenBookmarkNewTab: parsed.OpenBookmarkNewTab ?? true,
    ShowTitle: parsed.ShowTitle ?? true,
    Greetings: parsed.Greetings ?? '你好',
    ShowSearchComponent: parsed.ShowSearchComponent ?? true,
    DisabledSearchAutoFocus: parsed.DisabledSearchAutoFocus ?? false,
    ShowDateTime: parsed.ShowDateTime ?? true,
    ShowApps: parsed.ShowApps ?? true,
    ShowBookmarks: parsed.ShowBookmarks ?? true,
    HideSettingsButton: parsed.HideSettingsButton ?? false,
    HideHelpButton: parsed.HideHelpButton ?? false,
    EnableEncryptedLink: parsed.EnableEncryptedLink ?? false,
    IconMode: parsed.IconMode ?? 'DEFAULT',
    Theme: parsed.Theme ?? 'blackboard',
    KeepLetterCase: parsed.KeepLetterCase ?? false,
  };
}

export function importAppsToml(tomlStr: string): Bookmark[] {
  const parsed = parse(tomlStr) as unknown as AppsToml;
  if (!parsed?.links) return [];
  return parsed.links.map((link, i) => ({
    type: 'app' as const,
    name: link.name,
    url: link.link,
    icon: link.icon ?? '',
    desc: link.desc ?? '',
    private: 0,
    category_id: null,
    sort_order: i,
  }));
}

export function importBookmarksToml(tomlStr: string): { categories: Category[]; links: Bookmark[] } {
  const parsed = parse(tomlStr) as unknown as BookmarksToml;
  const categories: Category[] = (parsed.categories ?? []).map((cat, i) => ({
    id: cat.id,
    type: 'bookmark',
    title: cat.title,
    sort_order: i,
  }));
  const links: Bookmark[] = (parsed.links ?? []).map((link, i) => ({
    type: 'bookmark' as const,
    name: link.name,
    url: link.link,
    icon: link.icon ?? '',
    desc: link.desc ?? '',
    private: link.private ? 1 : 0,
    category_id: link.category || null,
    sort_order: i,
  }));
  return { categories, links };
}

// -- Export: D1 → TOML format ---------------------------------------------------

export function exportConfigToml(settings: Application): string {
  return stringify(settings);
}

export function exportAppsToml(apps: Bookmark[]): string {
  const links = apps.map((a) => {
    const obj: Record<string, unknown> = { name: a.name, link: a.url };
    if (a.icon) obj.icon = a.icon;
    if (a.desc) obj.desc = a.desc;
    return obj;
  });
  return stringify({ links });
}

export function exportBookmarksToml(categories: Category[], bookmarks: Bookmark[]): string {
  const cats = categories.map((c) => ({ id: c.id, title: c.title }));
  const links = bookmarks.map((b) => {
    const obj: Record<string, unknown> = { name: b.name, link: b.url };
    if (b.icon) obj.icon = b.icon;
    if (b.desc) obj.desc = b.desc;
    if (b.private) obj.private = true;
    if (b.category_id) obj.category = b.category_id;
    return obj;
  });
  return stringify({ categories: cats, links });
}

// -- Default data --------------------------------------------------------------

export function getDefaultAppConfig(): Application {
  return {
    Title: 'flare',
    Footer: '由 <a href="https://github.com/lurenyang418/flare">Flare</a> ❤️ 强力驱动',
    OpenAppNewTab: true,
    OpenBookmarkNewTab: true,
    ShowTitle: true,
    Greetings: '你好',
    ShowSearchComponent: true,
    DisabledSearchAutoFocus: false,
    ShowDateTime: true,
    ShowApps: true,
    ShowBookmarks: true,
    HideSettingsButton: false,
    HideHelpButton: false,
    EnableEncryptedLink: false,
    IconMode: 'DEFAULT',
    Theme: 'blackboard',
    KeepLetterCase: false,
  };
}

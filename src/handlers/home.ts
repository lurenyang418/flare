import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getSettings, getLinksByType, getCategories, searchLinks } from '../db/schema';
import { getThemeBodyStyle } from '../utils/themes';
import { parseRequestURL, parseDynamicUrl } from '../utils/url';
import {
  getGreeting,
  renderApplications,
  renderBookmarks,
  renderHelpApps,
  renderHomePage,
  type LinkRenderOptions,
} from '../services/renderer';
import type { Application, Bookmark, Category } from '../types/models';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function formatDate(date: Date): { date: string; time: string; day: string } {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return {
    date: `${y}年${m}月${d}日`,
    time: `${hh}:${mm}:${ss}`,
    day: WEEKDAYS[date.getDay()],
  };
}

function getLinkOptions(settings: Application): LinkRenderOptions {
  return {
    openNewTab: settings.OpenAppNewTab,
    enableEncryptedLink: settings.EnableEncryptedLink,
    iconMode: settings.IconMode,
  };
}

async function renderHome(c: Context, filter: string, pageName: string, subPage: boolean) {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const now = new Date();
  const dt = formatDate(now);

  const reqURL = parseRequestURL(c.req.raw);

  let apps: Bookmark[] = [];
  let categories: Category[] = [];
  let bookmarks: Bookmark[] = [];

  if (filter) {
    const allLinks = await searchLinks(db, filter);
    apps = allLinks.filter((l) => l.type === 'app').map((l) => ({ ...l, url: parseDynamicUrl(l.url, reqURL) }));
    bookmarks = allLinks.filter((l) => l.type === 'bookmark').map((l) => ({ ...l, url: parseDynamicUrl(l.url, reqURL) }));
    categories = await getCategories(db);
  } else {
    apps = (await getLinksByType(db, 'app')).map((l) => ({ ...l, url: parseDynamicUrl(l.url, reqURL) }));
    bookmarks = (await getLinksByType(db, 'bookmark')).map((l) => ({ ...l, url: parseDynamicUrl(l.url, reqURL) }));
    categories = await getCategories(db);
  }

  const bodyClassName = settings.KeepLetterCase ? '' : 'app-content-uppercase ';
  const hasKeyword = filter !== '';
  const searchKeyword = hasKeyword ? '搜索结果: ' + filter : ' ';

  const html = renderHomePage({
    pageName,
    bodyStyle: getThemeBodyStyle(settings.Theme),
    heroDate: dt.date,
    heroTime: dt.time,
    heroDay: dt.day,
    greetings: pageName === 'Home' ? getGreeting(settings.Greetings, now.getHours()) : pageName,
    applications: renderApplications(apps, filter, getLinkOptions(settings)),
    bookmarks: renderBookmarks(categories, bookmarks, filter, {
      openNewTab: settings.OpenBookmarkNewTab,
      enableEncryptedLink: settings.EnableEncryptedLink,
      iconMode: settings.IconMode,
    }),
    searchKeyword,
    hasKeyword,
    showSearchComponent: settings.ShowSearchComponent,
    disabledSearchAutoFocus: settings.DisabledSearchAutoFocus,
    optionTitle: settings.Title,
    optionFooter: settings.Footer,
    optionOpenAppNewTab: settings.OpenAppNewTab,
    optionOpenBookmarkNewTab: settings.OpenBookmarkNewTab,
    optionShowTitle: settings.ShowTitle,
    optionShowDateTime: settings.ShowDateTime,
    optionShowApps: settings.ShowApps,
    optionShowBookmarks: settings.ShowBookmarks,
    optionHideSettingsButton: settings.HideSettingsButton,
    optionHideHelpButton: settings.HideHelpButton,
    bodyClassName,
    subPage,
    bookmarksURI: '/bookmarks',
    applicationsURI: '/applications',
    settingsURI: '/settings',
  });

  return c.html(html);
}

// GET /
export async function pageHome(c: Context): Promise<Response> {
  return renderHome(c, '', 'Home', false);
}

// POST / (search)
export async function pageSearch(c: Context): Promise<Response> {
  const body = await c.req.parseBody<{ search?: string }>();
  const search = (body.search ?? '').trim();
  if (!search || search.length > 50) {
    return renderHome(c, '', 'Home', false);
  }
  return renderHome(c, search, 'Home', false);
}

// GET /applications
export async function pageApplications(c: Context): Promise<Response> {
  return renderHome(c, '', '应用', true);
}

// GET /bookmarks
export async function pageBookmarks(c: Context): Promise<Response> {
  return renderHome(c, '', '书签', true);
}

// GET /help
export async function pageHelp(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const now = new Date();
  const dt = formatDate(now);

  const showEditor = c.env?.ENABLE_EDITOR !== 'false';

  const html = renderHomePage({
    pageName: 'Home',
    bodyStyle: getThemeBodyStyle(settings.Theme),
    heroDate: dt.date,
    heroTime: dt.time,
    heroDay: dt.day,
    greetings: '帮助',
    applications: renderHelpApps(showEditor),
    bookmarks: '',
    searchKeyword: ' ',
    hasKeyword: false,
    showSearchComponent: settings.ShowSearchComponent,
    disabledSearchAutoFocus: true,
    optionTitle: settings.Title,
    optionFooter: settings.Footer,
    optionOpenAppNewTab: settings.OpenAppNewTab,
    optionOpenBookmarkNewTab: settings.OpenBookmarkNewTab,
    optionShowTitle: settings.ShowTitle,
    optionShowDateTime: settings.ShowDateTime,
    optionShowApps: true,
    optionShowBookmarks: false,
    optionHideSettingsButton: settings.HideSettingsButton,
    optionHideHelpButton: settings.HideHelpButton,
    bodyClassName: '',
    subPage: false,
    bookmarksURI: '/bookmarks',
    applicationsURI: '/applications',
    settingsURI: '/settings',
  });

  return c.html(html);
}

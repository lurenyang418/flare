import type { Application, Bookmark, Category } from '../types/models';
import { getThemeBodyStyle, THEME_PALETTES } from '../utils/themes';
import { getIconSVG } from '../utils/icons';
import { base64EncodeUrl } from '../utils/crypto';

// -- Greeting ------------------------------------------------------------------

export function getGreeting(greeting: string, hour?: number): string {
  const words = greeting.split(';');
  if (words.length === 1) return words[0].length > 0 ? words[0] : '你好';

  const h = hour ?? new Date().getUTCHours() + 8; // Default to UTC+8 (China)
  if (h >= 5 && h <= 10 && words[0].length > 0) return words[0];
  if (h >= 11 && h <= 13 && words[1].length > 0) return words[1];
  if (h >= 14 && h <= 18 && words[2].length > 0) return words[2];
  if (words[3]?.length > 0) return words[3];
  return '你好';
}

// -- Link rendering ------------------------------------------------------------

export interface LinkRenderOptions {
  openNewTab: boolean;
  enableEncryptedLink: boolean;
  iconMode: string;
}

export function renderLink(url: string, options: LinkRenderOptions): string {
  if (url.startsWith('chrome-extension://')) {
    return `/redir/url?go=${base64EncodeUrl(url)}`;
  }
  if (options.enableEncryptedLink) {
    return `/redir/url?go=${base64EncodeUrl(url)}`;
  }
  return url;
}

export function renderIcon(icon: string, url: string, options: LinkRenderOptions): string {
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return `<img src="${icon}"/>`;
  }
  if (icon) {
    return getIconSVG(icon);
  }
  if (options.iconMode === 'FILLING') {
    return `<img src="https://favicon.yandex.net/favicon/v2/${encodeURIComponent(url)}?size=32&stale=ok" width="24" height="24" onerror="this.style.display='none'" />`;
  }
  return getIconSVG('');
}

// -- Applications grid ---------------------------------------------------------

export function renderApplications(
  apps: Bookmark[],
  filter: string,
  options: LinkRenderOptions
): string {
  let filtered = apps;
  if (filter) {
    const f = filter.toLowerCase();
    filtered = apps.filter(
      (a) =>
        a.name.toLowerCase().includes(f) ||
        a.url.toLowerCase().includes(f) ||
        (a.desc ?? '').toLowerCase().includes(f)
    );
  }

  return filtered
    .map((app) => {
      const url = renderLink(app.url, options);
      const iconHtml = renderIcon(app.icon, app.url, options);
      const desc = app.desc || app.url;
      const target = options.openNewTab ? ' target="_blank" rel="noopener"' : '';
      return `<div class="app-container" data-id="${app.icon}">
        <a${target} href="${url}" class="app-item" title="${app.name}">
          <div class="app-icon">${iconHtml}</div>
          <div class="app-text">
            <p class="app-title">${app.name}</p>
            <p class="app-desc">${desc}</p>
          </div>
        </a>
      </div>`;
    })
    .join('');
}

// -- Bookmarks ----------------------------------------------------------------

export function renderBookmarks(
  categories: Category[],
  bookmarks: Bookmark[],
  filter: string,
  options: LinkRenderOptions
): string {
  let filtered = bookmarks;
  if (filter) {
    const f = filter.toLowerCase();
    filtered = bookmarks.filter(
      (b) => b.name.toLowerCase().includes(f) || b.url.toLowerCase().includes(f)
    );
  }

  if (categories.length === 0) {
    const items = renderBookmarkItems(filtered, options);
    return `<div class="bookmark-group-container pull-left"><ul class="bookmark-list">${items}</ul></div>`;
  }

  return categories
    .map((cat) => {
      const catItems = filtered.filter((b) => b.category_id === cat.id);
      if (catItems.length === 0) return '';
      const items = renderBookmarkItems(catItems, options);
      return `<div class="bookmark-group-container pull-left"><h3 class="bookmark-group-title">${cat.title}</h3><ul class="bookmark-list">${items}</ul></div>`;
    })
    .filter(Boolean)
    .join('');
}

function renderBookmarkItems(bookmarks: Bookmark[], options: LinkRenderOptions): string {
  return bookmarks
    .map((b) => {
      const url = renderLink(b.url, options);
      const iconHtml = renderIcon(b.icon, b.url, options);
      const target = options.openNewTab ? ' target="_blank" rel="noopener"' : '';
      return `<li><a${target} href="${url}" class="bookmark">${iconHtml}<span>${b.name}</span></a></li>`;
    })
    .join('');
}

// -- Help page apps ------------------------------------------------------------

export function renderHelpApps(showEditor: boolean): string {
  const apps = [
    { name: '程序首页', url: '/', icon: 'homeCircle', desc: '' },
    { name: '帮助页面', url: '/help', icon: 'helpCircle', desc: '' },
    { name: '程序设置', url: '/settings', icon: 'fireCircle', desc: '' },
  ];

  if (showEditor) {
    apps.push({ name: '内容编辑', url: '/editor', icon: 'pencilCircle', desc: '' });
  }

  apps.push(
    { name: '图标挑选', url: '/icons', icon: 'heartCircle', desc: '' },
    { name: '主题设置', url: '/settings/theme', icon: 'starCircle', desc: '' },
    { name: '搜索设置', url: '/settings/search', icon: 'lightningBoltCircle', desc: '' },
    { name: '界面设置', url: '/settings/appearance', icon: 'leafCircle', desc: '' },
    { name: '程序版本', url: '/settings/application', icon: 'commaCircle', desc: '' },
    {
      name: '问题反馈',
      url: 'https://github.com/lurenyang418/flare/issues',
      icon: 'crownCircle',
      desc: 'GitHub Issues',
    }
  );

  return apps
    .map((app) => {
      const desc = app.desc || app.url;
      return `<div class="app-container" data-id="${app.icon}">
        <a href="${app.url}" class="app-item" title="${app.name}">
          <div class="app-icon">${getIconSVG(app.icon)}</div>
          <div class="app-text">
            <p class="app-title">${app.name}</p>
            <p class="app-desc">${desc}</p>
          </div>
        </a>
      </div>`;
    })
    .join('');
}

// -- Theme palette rendering ---------------------------------------------------

export function renderThemePalettes(currentTheme: string): string {
  return THEME_PALETTES
    .map((p) => `
      <div class="pull-left theme theme-${p.name}">
        <div class="theme-container clearfix">
          <input class="theme-choose" name="theme" type="submit" value="${p.name}">
          <div class="pull-left theme-color color-background" style="background-color: ${p.colors.background};"></div>
          <div class="pull-left theme-color color-primary" style="background-color: ${p.colors.primary};"></div>
          <div class="pull-left theme-color color-accent" style="background-color: ${p.colors.accent};"></div>
        </div>
        <p class="theme-title">${p.name}</p>
      </div>`)
    .join('');
}

// -- Full HTML page renderer ---------------------------------------------------

export interface PageData {
  pageName: string;
  bodyStyle: string;
  // Hero
  heroDate: string;
  heroTime: string;
  heroDay: string;
  greetings: string;
  // Content
  applications?: string;
  bookmarks?: string;
  searchKeyword: string;
  hasKeyword: boolean;
  // Options
  showSearchComponent: boolean;
  disabledSearchAutoFocus: boolean;
  optionTitle: string;
  optionFooter: string;
  optionOpenAppNewTab: boolean;
  optionOpenBookmarkNewTab: boolean;
  optionShowTitle: boolean;
  optionShowDateTime: boolean;
  optionShowApps: boolean;
  optionShowBookmarks: boolean;
  optionHideSettingsButton: boolean;
  optionHideHelpButton: boolean;
  bodyClassName: string;
  // Sub-page
  subPage: boolean;
  // URIs
  bookmarksURI: string;
  applicationsURI: string;
  settingsURI: string;
}

export function renderHomePage(data: PageData): string {
  const cssLinks = `<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/home/search.css">
<link rel="stylesheet" href="/assets/css/home/hero.css">
<link rel="stylesheet" href="/assets/css/home/apps.css">
<link rel="stylesheet" href="/assets/css/home/bookmarks.css">
<link rel="stylesheet" href="/assets/css/home/toolbar.css">`;

  const searchHTML = data.showSearchComponent
    ? `<div class="module-container" id="search-container">
        <form action="/" method="POST">
          ${data.disabledSearchAutoFocus
            ? '<input type="text" name="search" id="search" autocomplete="off" placeholder="' + data.searchKeyword + '"/>'
            : '<input type="text" name="search" id="search" autocomplete="off" autofocus placeholder="' + data.searchKeyword + '"/>'}
          ${data.hasKeyword ? '<a href="/">>> TIPS: 点此标签或再次敲击回车，返回首页</a>' : ''}
          <label for="search" id="search-label">书签太多？试试搜索你想寻找的书签吧 :)</label>
        </form>
      </div>`
    : '';

  const subPageHeader = data.subPage
    ? `<div class="sub-page-header"><h1>${data.pageName}</h1><p><a href="/">返回</a></p></div>`
    : '';

  const appsSection = data.optionShowApps
    ? `<div class="plugin-container" id="container-apps">
        <h2><a href="${data.applicationsURI}">应用</a></h2>
        <div class="apps-container clearfix">${data.applications ?? ''}</div>
      </div>`
    : '';

  const bookmarksSection = data.optionShowBookmarks
    ? `<div class="plugin-container clearfix" id="container-bookmakrs">
        <h2><a href="${data.bookmarksURI}">书签</a></h2>
        ${data.bookmarks ?? ''}
      </div>`
    : '';

  const settingsBtn = data.optionHideSettingsButton
    ? ''
    : `<div class="toolbar-btn-bg toolbar-btn-settings">
        <a href="${data.settingsURI}" id="btn-open-settings" alt="Settings">
          <span>Open Settings</span>
          <svg viewBox="0 0 24 24" width="24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" style="fill: var(--color-background);"></path>
          </svg>
        </a>
      </div>`;

  const helpBtn = data.optionHideHelpButton
    ? ''
    : `<div class="toolbar-btn-bg toolbar-btn-help">
        <a href="/help" id="btn-open-help" alt="Help">
          <span>Help</span>
          <svg viewBox="0 0 24 24" width="24">
            <path d="M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,9.88 15.64,10.67 15.07,11.25M13,19H11V17H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z" style="fill: var(--color-background);"></path>
          </svg>
        </a>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="google" content="notranslate">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.optionTitle}</title>
  <link rel="shortcut icon" href="/favicon.ico"/>
  ${cssLinks}
  <meta name="description" content="Flare - 个人导航页"/>
</head>
<body style="${data.bodyStyle}" class="${data.bodyClassName}">
  <div class="pageview" id="page-home">
    <div class="container no-select">
      ${searchHTML}
      <div class="module-container" id="hero-container">
        <div id="plugin-datetime">
          ${data.optionShowDateTime ? `<p><span>${data.heroDate}</span> <span>${data.heroDay}</span> <span>${data.heroTime}</span></p>` : ''}
          ${data.optionShowTitle ? `<h1 class="plugin-container" id="plugin-greetings">${data.greetings}</h1>` : ''}
        </div>
      </div>
      ${subPageHeader}
      ${appsSection}
      ${bookmarksSection}
      <div class="toolbar-container">${settingsBtn}${helpBtn}</div>
      <div class="footer-container">${data.optionFooter}</div>
    </div>
  </div>
</body>
</html>`;
}

// -- Settings page renderer -----------------------------------------------------

export interface SettingsPageData {
  bodyStyle: string;
  optionTitle: string;
}

export function renderSettingsPage(content: string, sidebarActive: string, data: SettingsPageData): string {
  const settingsCSS = `<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/settings/sidebar.css">
<link rel="stylesheet" href="/assets/css/settings/layout.css">
<link rel="stylesheet" href="/assets/css/settings/theme.css">`;

  const sidebarItems = [
    { name: 'Theme', path: '/settings/theme', title: '主题' },
    { name: 'Search', path: '/settings/search', title: '搜索' },
    { name: 'Appearance', path: '/settings/appearance', title: '界面' },
    { name: 'Others', path: '/settings/application', title: '其他' },
  ];

  const sidebar = sidebarItems
    .map((item) => {
      const active = sidebarActive === item.name ? ' class="active"' : '';
      return `<a href="${item.path}"${active}>${item.title}</a>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="google" content="notranslate">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.optionTitle} - Settings</title>
  ${settingsCSS}
</head>
<body style="${data.bodyStyle}">
  <div class="pageview" id="page-settings">
    <div class="container">
      <div class="header">
        <h1>应用设置</h1>
        <p><a href="/">返回</a></p>
      </div>
      <div class="main-container clearfix">
        <div class="sidebar pull-left">${sidebar}</div>
        ${content}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// -- Editor page renderer ------------------------------------------------------

export function renderEditorPage(
  categories: Category[],
  bookmarks: Bookmark[],
  apps: Bookmark[],
  data: SettingsPageData
): string {
  const categoriesJSON = JSON.stringify(categories);
  const allBookmarks = [
    ...apps.map((a) => ({ ...a, category_id: '_FLARE_FIXED_CATEGORY' })),
    ...bookmarks,
  ];
  const bookmarksJSON = JSON.stringify(allBookmarks);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.optionTitle} - Editor</title>
  <link rel="stylesheet" href="/assets/editor/handsontable.full.min.css">
  <style>body { margin: 20px; font-family: sans-serif; }</style>
</head>
<body>
  <h1>内容编辑</h1>
  <p><a href="/">← 返回首页</a></p>
  <div id="categories-table"></div>
  <div id="bookmarks-table"></div>
  <button id="btn-save">保存</button>
  <div id="save-status"></div>

  <script>
    window.__CATEGORIES__ = ${categoriesJSON};
    window.__BOOKMARKS__ = ${bookmarksJSON};
  </script>
  <script src="/assets/editor/handsontable.full.min.js"></script>
  <script>
    // Minimal Handsontable editor
    const categoriesContainer = document.getElementById('categories-table');
    const bookmarksContainer = document.getElementById('bookmarks-table');
    const saveBtn = document.getElementById('btn-save');
    const statusDiv = document.getElementById('save-status');

    const categoryData = window.__CATEGORIES__.map(c => [c.id, c.title]);
    const bookmarkData = window.__BOOKMARKS__.map(b => [b.name, b.url, b.category_id, b.icon, b.desc]);

    // Categories table
    const catHot = new Handsontable(categoriesContainer, {
      data: categoryData,
      colHeaders: ['ID', 'Name'],
      columns: [
        { data: 0, type: 'text', readOnly: true },
        { data: 1, type: 'text' }
      ],
      minSpareRows: 1,
      licenseKey: 'non-commercial-and-evaluation'
    });

    // Bookmarks table
    const bmHot = new Handsontable(bookmarksContainer, {
      data: bookmarkData,
      colHeaders: ['Name', 'URL', 'Category', 'Icon', 'Desc'],
      columns: [
        { data: 0, type: 'text' },
        { data: 1, type: 'text' },
        { data: 2, type: 'dropdown', source: ['_FLARE_FIXED_CATEGORY', ...window.__CATEGORIES__.map(c => c.id)] },
        { data: 3, type: 'text' },
        { data: 4, type: 'text' }
      ],
      minSpareRows: 1,
      licenseKey: 'non-commercial-and-evaluation'
    });

    saveBtn.addEventListener('click', async () => {
      statusDiv.textContent = 'Saving...';
      const form = new FormData();
      form.append('categories', catHot.getData().filter(r => r[0] && r[1]).map(r => r.join(',')).join('\\n'));
      form.append('bookmarks', bmHot.getData().filter(r => r[0] && r[1]).map(r => r.join(',')).join('\\n'));
      try {
        const resp = await fetch('/editor', { method: 'POST', body: form });
        if (resp.ok) {
          statusDiv.textContent = 'Saved!';
          location.reload();
        } else {
          statusDiv.textContent = 'Save failed.';
        }
      } catch (e) {
        statusDiv.textContent = 'Error: ' + e.message;
      }
    });
  </script>
</body>
</html>`;
}

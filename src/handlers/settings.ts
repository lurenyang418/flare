import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getSettings, updateSettings } from '../db/schema';
import { getThemeBodyStyle } from '../utils/themes';
import { renderSettingsPage, renderThemePalettes } from '../services/renderer';
import { isLoggedIn, getAuthConfig, getUserName } from '../middleware/auth';
import type { Application } from '../types/models';

function basePageData(settings: Application) {
  return {
    bodyStyle: getThemeBodyStyle(settings.Theme),
    optionTitle: settings.Title,
  };
}

function sel(value: string, current: string): string {
  return value === current ? ' selected' : '';
}

function selBool(value: boolean, current: boolean): string {
  return value === current ? ' selected' : '';
}

// -- Theme settings ------------------------------------------------------------

export async function pageTheme(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const pd = basePageData(settings);

  const content = `<div class="setting-group-container">
    <form method="POST" action="/settings/theme">
      <h2>设置主题</h2>
      <div class="theme-groups clearfix">${renderThemePalettes(settings.Theme)}</div>
    </form>
  </div>`;

  return c.html(renderSettingsPage(content, 'Theme', pd));
}

export async function saveTheme(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const body = await c.req.parseBody<{ theme?: string }>();
  if (body.theme) {
    settings.Theme = String(body.theme);
    await updateSettings(db, settings);
  }
  return c.redirect('/settings/theme');
}

// -- Search settings -----------------------------------------------------------

export async function pageSearch(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const pd = basePageData(settings);

  const content = `<div class="setting-group-container">
    <form method="POST" action="/settings/search">
      <h2>页面搜索</h2>
      <div class="form-group">
        <label for="show-search-component">展示搜索工具栏</label>
        <select name="show-search-component" id="show-search-component">
          <option value="1"${selBool(true, settings.ShowSearchComponent)}>是</option>
          <option value="0"${selBool(false, settings.ShowSearchComponent)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="disabled-search-auto-focus">禁用搜索栏自动获得焦点</label>
        <select name="disabled-search-auto-focus" id="disabled-search-auto-focus">
          <option value="1"${selBool(true, settings.DisabledSearchAutoFocus)}>是</option>
          <option value="0"${selBool(false, settings.DisabledSearchAutoFocus)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <input class="btn-submit" type="submit" value="保存修改" />
      </div>
    </form>
  </div>`;

  return c.html(renderSettingsPage(content, 'Search', pd));
}

export async function saveSearch(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const body = await c.req.parseBody<{ 'show-search-component'?: string; 'disabled-search-auto-focus'?: string }>();
  settings.ShowSearchComponent = body['show-search-component'] === '1';
  settings.DisabledSearchAutoFocus = body['disabled-search-auto-focus'] === '1';
  await updateSettings(db, settings);
  return c.redirect('/settings/search');
}

// -- Appearance settings -------------------------------------------------------

export async function pageAppearance(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const pd = basePageData(settings);

  const content = `<div class="setting-group-container">
    <form method="POST" action="/settings/appearance">
      <h2>通用设置</h2>
      <div class="form-group">
        <label for="settings-title">自定义标题</label>
        <input type="text" name="title" id="settings-title" class="option-input" placeholder="站点标题" value="${settings.Title.replace(/"/g, '&quot;')}">
      </div>
      <div class="form-group">
        <label for="settings-footer">自定义页脚</label>
        <textarea name="footer" id="settings-footer" class="option-input" cols="30" rows="10" placeholder="输入你自己的文本或 HTML 片段">${settings.Footer.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <p class="help-text">如不希望展示页脚，可以将内容清空</p>
      </div>
      <div class="form-group">
        <label for="settings-open-app-newtab">总是在新窗口打开应用</label>
        <select name="open-app-newtab" id="settings-open-app-newtab">
          <option value="1"${selBool(true, settings.OpenAppNewTab)}>是</option>
          <option value="0"${selBool(false, settings.OpenAppNewTab)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-open-bookmark-newtab">总是在新窗口打开书签</label>
        <select name="open-bookmark-newtab" id="settings-open-bookmark-newtab">
          <option value="1"${selBool(true, settings.OpenBookmarkNewTab)}>是</option>
          <option value="0"${selBool(false, settings.OpenBookmarkNewTab)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-enable-encrypted-link">展示加密链接</label>
        <select name="enable-encrypted-link" id="settings-enable-encrypted-link">
          <option value="1"${selBool(true, settings.EnableEncryptedLink)}>是</option>
          <option value="0"${selBool(false, settings.EnableEncryptedLink)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-keep-letter-case">保持配置和界面链接大小写一致</label>
        <select name="keep-letter-case" id="settings-keep-letter-case">
          <option value="1"${selBool(true, settings.KeepLetterCase)}>是</option>
          <option value="0"${selBool(false, settings.KeepLetterCase)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-icon-mode">链接图标的获取和展示</label>
        <select name="icon-mode" id="settings-icon-mode">
          <option value="DEFAULT"${sel('DEFAULT', settings.IconMode)}>默认</option>
          <option value="FILLING"${sel('FILLING', settings.IconMode)}>针对没有图标的内容，使用公共服务抓取</option>
        </select>
      </div>
      <h2>模块设置</h2>
      <div class="form-group">
        <label for="settings-show-title">展示标题组件（问候语）</label>
        <select name="show-title" id="settings-show-title">
          <option value="1"${selBool(true, settings.ShowTitle)}>是</option>
          <option value="0"${selBool(false, settings.ShowTitle)}>否</option>
        </select>
      </div>
      ${settings.ShowTitle ? `<div class="form-group">
        <label for="settings-custom-greetings">自定义问候语</label>
        <input type="text" name="greetings" id="settings-custom-greetings" class="option-input" placeholder="你好" value="${settings.Greetings.replace(/"/g, '&quot;')}">
        <p class="help-text">如果你希望展示固定内容，可以输入："你好"；<br />如果你希望根据时段展示不同内容，可以将多个内容用英文;号进行分割："早上好;中午好;下午好;晚上好"</p>
      </div>` : ''}
      <div class="form-group">
        <label for="settings-show-datetime">展示首页日期</label>
        <select name="show-datetime" id="settings-show-datetime">
          <option value="1"${selBool(true, settings.ShowDateTime)}>是</option>
          <option value="0"${selBool(false, settings.ShowDateTime)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-show-apps">展示应用模块</label>
        <select name="show-apps" id="settings-show-apps">
          <option value="1"${selBool(true, settings.ShowApps)}>是</option>
          <option value="0"${selBool(false, settings.ShowApps)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-show-bookmarks">展示书签模块</label>
        <select name="show-bookmarks" id="settings-show-bookmarks">
          <option value="1"${selBool(true, settings.ShowBookmarks)}>是</option>
          <option value="0"${selBool(false, settings.ShowBookmarks)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-hide-settings-button">隐藏首页设置按钮</label>
        <select name="hide-settings-button" id="settings-hide-settings-button">
          <option value="1"${selBool(true, settings.HideSettingsButton)}>是</option>
          <option value="0"${selBool(false, settings.HideSettingsButton)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <label for="settings-hide-help-button">隐藏首页帮助按钮</label>
        <select name="hide-help-button" id="settings-hide-help-button">
          <option value="1"${selBool(true, settings.HideHelpButton)}>是</option>
          <option value="0"${selBool(false, settings.HideHelpButton)}>否</option>
        </select>
      </div>
      <div class="form-group">
        <input class="btn-submit" type="submit" value="保存修改" />
      </div>
    </form>
  </div>`;

  return c.html(renderSettingsPage(content, 'Appearance', pd));
}

export async function saveAppearance(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const body = await c.req.parseBody<Record<string, string>>();

  if (body.title !== undefined) settings.Title = String(body.title);
  if (body.footer !== undefined) settings.Footer = String(body.footer);
  if (body.greetings !== undefined) settings.Greetings = String(body.greetings);
  settings.OpenAppNewTab = body['open-app-newtab'] === '1';
  settings.OpenBookmarkNewTab = body['open-bookmark-newtab'] === '1';
  settings.EnableEncryptedLink = body['enable-encrypted-link'] === '1';
  settings.KeepLetterCase = body['keep-letter-case'] === '1';
  if (body['icon-mode']) settings.IconMode = String(body['icon-mode']);
  settings.ShowTitle = body['show-title'] === '1';
  settings.ShowDateTime = body['show-datetime'] === '1';
  settings.ShowApps = body['show-apps'] === '1';
  settings.ShowBookmarks = body['show-bookmarks'] === '1';
  settings.HideSettingsButton = body['hide-settings-button'] === '1';
  settings.HideHelpButton = body['hide-help-button'] === '1';

  await updateSettings(db, settings);
  return c.redirect('/settings/appearance');
}

// -- Others (login/logout/version) --------------------------------------------

export async function pageOthers(c: Context): Promise<Response> {
  const db = getDB(c);
  const settings = (await getSettings(db))!;
  const pd = basePageData(settings);
  const config = getAuthConfig(c);
  const loggedIn = await isLoggedIn(c);

  let loginSection = '';
  if (!config.disableLogin) {
    if (loggedIn) {
      loginSection = `<form method="POST" action="/logout">
        <div class="form-group form-about">
          <h2>登录</h2>
          <div class="form-group">
            <p>当前用户 ${await getUserName(c)}</p>
          </div>
          <div class="form-group">
            <input class="btn-submit" type="submit" value="退出" />
          </div>
        </div>
      </form>`;
    } else {
      loginSection = `<form method="POST" action="/login">
        <div class="form-group form-about">
          <h2>登录</h2>
          <div class="form-group">
            <label for="user-name">用户名</label>
            <input type="text" name="username" id="user-name" class="option-input" placeholder="请输入用户名">
          </div>
          <div class="form-group">
            <label for="user-pass">密码</label>
            <input type="password" name="password" id="user-pass" class="option-input" placeholder="请输入密码">
          </div>
          <div class="form-group">
            <input class="btn-submit" type="submit" value="登录" />
          </div>
          <br />
        </div>
      </form>`;
    }
  }

  const content = `<div class="setting-group-container">
    ${loginSection}
    ${loginSection ? '<br /><hr /><br />' : ''}
    <form method="POST" action="/settings/application">
      <div class="form-group form-about">
        <h2>关于 Flare</h2>
        <p>轻量、快速、美观的个人导航页面，帮你快速启动常用站点。</p>
        <br />
        <p>项目地址：<a href="https://github.com/lurenyang418/flare" target="_blank">lurenyang418/flare</a> </p>
        <p>程序版本：Flare Workers v1.0.0</p>
      </div>
    </form>
  </div>`;

  return c.html(renderSettingsPage(content, 'Others', pd));
}

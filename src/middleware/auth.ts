import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { generateRandomString } from '../utils/crypto';

interface AuthConfig {
  user: string;
  pass: string;
  visibility: string;
  disableLogin: boolean;
}

const SESSION_COOKIE = 'flare_session';
const SESSION_USER = 'USER_NAME';

function getSecret(c: Context): string {
  return (c.env?.FLARE_PASS as string) || 'flare-worker-secret';
}

async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifySession(c: Context): Promise<Record<string, string>> {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (!cookie) return {};
  try {
    const [payload, sig] = cookie.split('.');
    if (!payload || !sig) return {};
    const secret = getSecret(c);
    const expected = await sign(payload, secret);
    if (sig !== expected) return {};
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

async function setSessionData(c: Context, data: Record<string, string>): Promise<void> {
  const json = JSON.stringify(data);
  const payload = btoa(json);
  const secret = getSecret(c);
  const sig = await sign(payload, secret);
  setCookie(c, SESSION_COOKIE, `${payload}.${sig}`, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    maxAge: 86400,
  });
}

export function getAuthConfig(c: Context): AuthConfig {
  return {
    user: c.env?.FLARE_USER ?? 'flare',
    pass: c.env?.FLARE_PASS ?? generateRandomString(8),
    visibility: c.env?.VISIBILITY ?? 'DEFAULT',
    disableLogin: c.env?.DISABLE_LOGIN === 'true',
  };
}

export async function isLoggedIn(c: Context): Promise<boolean> {
  const session = await verifySession(c);
  return SESSION_USER in session;
}

export async function getUserName(c: Context): Promise<string> {
  const session = await verifySession(c);
  return session[SESSION_USER] ?? '';
}

/**
 * Auth middleware that redirects to login if not authenticated.
 * Skip when login is disabled.
 */
export const authRequired: MiddlewareHandler = async (c, next) => {
  const config = getAuthConfig(c);
  if (config.disableLogin) return next();

  if (!(await isLoggedIn(c))) {
    return c.redirect('/settings/application');
  }
  return next();
};

/**
 * Login handler - POST /login
 */
export async function handleLogin(c: Context): Promise<Response> {
  const config = getAuthConfig(c);
  const body = await c.req.parseBody<{ username?: string; password?: string }>();
  const username = body.username ?? '';
  const password = body.password ?? '';

  if (username === config.user && password === config.pass) {
    await setSessionData(c, {
      [SESSION_USER]: username,
    });
    return c.redirect('/settings/application');
  }

  return c.html(`<html><body><p>登录失败，用户名或密码错误。</p><p><a href="/settings/application">返回</a></p></body></html>`);
}

/**
 * Logout handler - POST /logout
 */
export function handleLogout(c: Context): Response {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.redirect('/settings/application');
}

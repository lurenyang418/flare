import type { Context } from 'hono';
import { getDB } from '../utils/db';
import { getAllLinks } from '../db/schema';
import { base64DecodeUrl } from '../utils/crypto';
import { parseRequestURL, parseDynamicUrl } from '../utils/url';

const ERROR_HTML = `<html><p>找不到匹配的跳转地址，请确认地址未被人为修改。</p><p>或前往 <a href="https://github.com/lurenyang418/flare/issues/" target="_blank">https://github.com/lurenyang418/flare/issues/</a> 反馈使用中的问题，谢谢！</html>`;

/**
 * GET /redir - Redirect to home
 */
export function redirHome(c: Context): Response {
  return c.redirect('/', 302);
}

/**
 * GET /redir/url?go=<base64> - Decode and validate URL, then redirect
 */
export async function redirURL(c: Context): Promise<Response> {
  const encoded = c.req.query('go');
  if (!encoded) {
    return c.html(ERROR_HTML, 400);
  }

  let decoded: string;
  try {
    decoded = base64DecodeUrl(encoded);
  } catch {
    return c.html(ERROR_HTML, 400);
  }

  const db = getDB(c);
  const reqURL = parseRequestURL(c.req.raw);
  const allLinks = await getAllLinks(db);
  const found = allLinks.find((link) => parseDynamicUrl(link.url, reqURL) === decoded);

  if (!found) {
    return c.html(ERROR_HTML, 400);
  }

  return c.redirect(decoded, 302);
}

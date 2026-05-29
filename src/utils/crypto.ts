export function base64EncodeUrl(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64DecodeUrl(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

export function generateRandomString(length: number = 8): string {
  const chars = '0123456789abcdef';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export function maskTextWithStars(text: string): string {
  return '*'.repeat(text.length);
}

export function jsonStringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

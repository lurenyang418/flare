interface DynamicURL {
  host: string;
  hostname: string;
  href: string;
  origin: string;
  pathname: string;
  port: string;
  protocol: string;
}

function getPort(host: string, defaultPort: string): { hostname: string; port: string } {
  const match = host.match(/([\w.-]+):(\d+)$/);
  if (match) {
    return { hostname: match[1], port: match[2] };
  }
  return { hostname: host, port: defaultPort };
}

export function parseRequestURL(request: Request): DynamicURL {
  const url = new URL(request.url);
  const scheme = url.protocol; // 'http:' or 'https:'
  const defaultPort = scheme === 'https:' ? '443' : '80';
  const host = url.host;
  const { hostname, port } = getPort(host, defaultPort);

  return {
    host,
    hostname,
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    port,
    protocol: scheme,
  };
}

export function parseDynamicUrl(url: string, reqURL: DynamicURL): string {
  return url
    .replace(/\{host\}/g, reqURL.host)
    .replace(/\{hostname\}/g, reqURL.hostname)
    .replace(/\{href\}/g, reqURL.href)
    .replace(/\{origin\}/g, reqURL.origin)
    .replace(/\{pathname\}/g, reqURL.pathname)
    .replace(/\{port\}/g, reqURL.port)
    .replace(/\{protocol\}/g, reqURL.protocol);
}

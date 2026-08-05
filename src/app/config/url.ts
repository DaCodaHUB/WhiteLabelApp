function parseHttpUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use HTTP or HTTPS.');
  }
  return parsed;
}

export function buildClientUrl(baseUrl: string, route: string): string {
  const base = parseHttpUrl(baseUrl);
  const normalizedBasePath = base.pathname.replace(/\/+$/, '');
  const normalizedRoute = route.replace(/^\/+/, '');
  const joinedPath = `${normalizedBasePath}/${normalizedRoute}` || '/';
  return parseHttpUrl(`${base.origin}${joinedPath}`).toString();
}

export function isAllowedClientUrl(url: string, allowedDomains: string[]): boolean {
  let hostname: string;
  try {
    hostname = parseHttpUrl(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  return allowedDomains.some(domain => {
    const allowed = domain.trim().toLowerCase().replace(/^\*\./, '');
    return allowed.length > 0 && (hostname === allowed || hostname.endsWith(`.${allowed}`));
  });
}

export function buildEmailUrl(email: string, subject?: string, body?: string): string | null {
  const address = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
  const query = new URLSearchParams();
  if (subject) query.set('subject', subject);
  if (body) query.set('body', body);
  const suffix = query.toString();
  return `mailto:${address}${suffix ? `?${suffix}` : ''}`;
}

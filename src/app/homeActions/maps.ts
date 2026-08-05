export function buildMapsUrl(address: string): string | null {
  const destination = address.trim();
  return destination ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` : null;
}

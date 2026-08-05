export function normalizePhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[^+\d\s().-]/.test(trimmed) || (trimmed.match(/\+/g)?.length ?? 0) > 1 || trimmed.includes('+', 1)) {
    return null;
  }
  const normalized = trimmed.replace(/[\s().-]/g, '');
  return /^\+?\d+$/.test(normalized) ? normalized : null;
}

export function buildTelephoneUrl(value: string): string | null {
  const phone = normalizePhoneNumber(value);
  return phone ? `tel:${phone}` : null;
}

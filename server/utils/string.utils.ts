/**
 * Capitalize each word in text (Title Case / CSS text-transform: capitalize behavior)
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  const str = String(text).trim();
  if (!str) return '';
  const isAllUpper = str === str.toUpperCase() && /[A-Z]/.test(str);
  const normalized = isAllUpper ? str.toLowerCase() : str;
  return normalized.replace(/\b([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Utility to generate strictly unique sequential serial item code
 */
export function generateUniqueItemCode(
  existingItems: Array<{ code?: string }>,
  prefix: string = 'LF',
  dateFound?: string
): string {
  const cleanPrefix = (prefix || 'LF').trim().toUpperCase();
  const targetYear = dateFound ? new Date(dateFound).getFullYear() : new Date().getFullYear();
  const year = isNaN(targetYear) ? new Date().getFullYear() : targetYear;

  const existingCodes = new Set<string>();
  let maxSeq = 0;

  for (const item of existingItems) {
    if (!item?.code) continue;
    const c = item.code.trim().toUpperCase();
    existingCodes.add(c);
    const match = c.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq && num < 1000000) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${cleanPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  while (existingCodes.has(candidate)) {
    nextSeq++;
    candidate = `${cleanPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

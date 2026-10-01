import { LostItem } from '../types';

/**
 * Generates a strictly unique, sequential serial code for lost & found items.
 * e.g., LF-2026-0001, LF-2026-0002, LF-2026-0015, etc.
 * 
 * Guarantees no duplicates or collisions across all stored and active items.
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

    // Extract trailing sequence numbers (e.g., LF-2026-0015 or LF-2026-08-015)
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

/**
 * Normalizes all items in a list so that every single item has a guaranteed
 * unique, sequential serial code without duplicates or legacy gaps.
 */
export function normalizeItemCodes(
  items: LostItem[],
  prefix: string = 'LF'
): LostItem[] {
  const cleanPrefix = (prefix || 'LF').trim().toUpperCase();
  const seenCodes = new Set<string>();
  let currentSeq = 1;

  return items.map((item) => {
    let code = item.code?.trim().toUpperCase();
    const year = item.dateFound ? new Date(item.dateFound).getFullYear() : 2026;
    const validYear = isNaN(year) ? 2026 : year;

    // Check if code matches standard unique format and is not seen yet
    const isStandardFormat = code && /^LF-\d{4}-\d{4}$/.test(code);

    if (!code || !isStandardFormat || seenCodes.has(code)) {
      code = `${cleanPrefix}-${validYear}-${String(currentSeq).padStart(4, '0')}`;
      while (seenCodes.has(code)) {
        currentSeq++;
        code = `${cleanPrefix}-${validYear}-${String(currentSeq).padStart(4, '0')}`;
      }
      currentSeq++;
    } else {
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= currentSeq) currentSeq = num + 1;
      }
    }

    seenCodes.add(code);
    return {
      ...item,
      code
    };
  });
}

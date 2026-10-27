export interface AccountLockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // epoch timestamp ms
  previouslyLocked: boolean;  // whether account has experienced a lockout before
  lastAttemptAt: number;
}

export const accountLockoutTracker = new Map<string, AccountLockoutState>();

export function getLevenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 999;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function normalizeAuthInput(input: string): string {
  if (!input) return '';
  // Strip zero-width, byte order mark, and invisible spaces
  let clean = input.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, '').trim();
  // Map non-Latin digits: U+09E6-U+09EF -> 0-9 and U+0660-U+0669 -> 0-9
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(new RegExp(String.fromCharCode(0x09e6 + i), 'g'), String(i));
    clean = clean.replace(new RegExp(String.fromCharCode(0x0660 + i), 'g'), String(i));
  }
  return clean;
}

export function resolveAuthCandidates(rawInput: string): { candidateList: string[]; isSuperAdminAlias: boolean } {
  const normalized = normalizeAuthInput(rawInput);
  const cleanInput = normalized.toLowerCase();
  const candidates = new Set<string>();
  candidates.add(cleanInput);
  candidates.add(normalized);
  if (rawInput.trim().toLowerCase() !== cleanInput) {
    candidates.add(rawInput.trim().toLowerCase());
  }

  // 1. TLD domain typos (e.g., .cokm, .con, .cmo, .comm, .coom -> .com)
  const fixedDomain = cleanInput
    .replace(/\.(cokm|cmo|con|comm|coom|cpm|vom)$/i, '.com')
    .replace(/@(gmai|gmaill|gmial|gmil)\.com$/i, '@gmail.com');
  candidates.add(fixedDomain);

  // 2. Super Admin typo corrections & Staff ID aliases for abusayeedriday@gmail.com
  // NOTE: riday@warwickhotels.com is an independent separate account in db.staff.
  const isSuperAdmin =
    cleanInput === 'abusayeedriday@gmail.com' ||
    cleanInput === 'abusayeedriay@gmail.com' ||
    cleanInput === 'abusayeedriday@gmail.cokm' ||
    cleanInput === 'mdriday256@gmail.com' ||
    cleanInput === 'mdriday256' ||
    cleanInput === '1273' ||
    cleanInput === 'stf-1273' ||
    cleanInput === 'stf1273' ||
    cleanInput === 'usr-1' ||
    cleanInput === 'staff-1' ||
    cleanInput.startsWith('abusayeedriay@') ||
    cleanInput.startsWith('abusayeedriday@');

  if (isSuperAdmin) {
    candidates.add('abusayeedriday@gmail.com');
    candidates.add('1273');
    candidates.add('stf-1273');
    candidates.add('usr-1');
    candidates.add('staff-1');
  }

  // 3. Staff ID numeric/prefix normalization (e.g., 1273 <-> stf-1273)
  if (/^\d+$/.test(cleanInput)) {
    candidates.add(`stf-${cleanInput}`);
    candidates.add(`stf${cleanInput}`);
  } else if (cleanInput.startsWith('stf-')) {
    candidates.add(cleanInput.replace(/^stf-/, ''));
  }

  return {
    candidateList: Array.from(candidates),
    isSuperAdminAlias: isSuperAdmin
  };
}

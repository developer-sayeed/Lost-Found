import { RecentUserSignature } from '../../types';

const RECENT_SIGNATURES_KEY = 'warwick_recent_user_signatures';
export const RECENT_SIGNATURES_EVENT = 'warwick_recent_signatures_updated';

/**
 * Loads recent signatures from localStorage
 */
export const getRecentSignatures = (): RecentUserSignature[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SIGNATURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse recent signatures from localStorage:', err);
    return [];
  }
};

/**
 * Saves or updates a signature in the recent user signatures list
 */
export const saveRecentSignature = (sig: {
  dataUrl: string;
  title?: string;
  name?: string;
  type?: 'pen' | 'upload' | 'digital';
}): RecentUserSignature | null => {
  if (!sig.dataUrl || sig.dataUrl.length < 50) return null;

  try {
    const existingList = getRecentSignatures();
    const now = new Date().toISOString();

    // Check if duplicate dataUrl already exists
    const existingIndex = existingList.findIndex(
      (item) => item.dataUrl === sig.dataUrl
    );

    let updatedRecord: RecentUserSignature;

    if (existingIndex >= 0) {
      const match = existingList[existingIndex];
      updatedRecord = {
        ...match,
        title: sig.title || match.title,
        name: sig.name || match.name,
        type: sig.type || match.type,
        lastUsedAt: now
      };
      existingList.splice(existingIndex, 1);
      existingList.unshift(updatedRecord);
    } else {
      updatedRecord = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dataUrl: sig.dataUrl,
        title: sig.title || 'Executive Signatory',
        name: sig.name || '',
        type: sig.type || 'digital',
        createdAt: now,
        lastUsedAt: now
      };
      existingList.unshift(updatedRecord);
    }

    // Limit to 30 most recent signatures
    const trimmed = existingList.slice(0, 30);
    localStorage.setItem(RECENT_SIGNATURES_KEY, JSON.stringify(trimmed));

    // Broadcast event to UI components
    window.dispatchEvent(
      new CustomEvent(RECENT_SIGNATURES_EVENT, { detail: trimmed })
    );

    // Asynchronously sync with server
    fetch('/api/certificates/signatures/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: updatedRecord.dataUrl,
        title: updatedRecord.title,
        name: updatedRecord.name,
        type: updatedRecord.type
      })
    }).catch(() => {
      // Offline fallback silent ignore
    });

    return updatedRecord;
  } catch (err) {
    console.warn('Failed to save signature to recent history:', err);
    return null;
  }
};

/**
 * Removes a signature from recent history
 */
export const deleteRecentSignature = async (id: string): Promise<boolean> => {
  try {
    const existingList = getRecentSignatures();
    const filtered = existingList.filter((item) => item.id !== id);
    localStorage.setItem(RECENT_SIGNATURES_KEY, JSON.stringify(filtered));

    window.dispatchEvent(
      new CustomEvent(RECENT_SIGNATURES_EVENT, { detail: filtered })
    );

    fetch(`/api/certificates/signatures/recent/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});

    return true;
  } catch (err) {
    console.warn('Failed to delete recent signature:', err);
    return false;
  }
};

/**
 * Purges all saved recent signatures
 */
export const clearAllRecentSignatures = async (): Promise<boolean> => {
  try {
    localStorage.removeItem(RECENT_SIGNATURES_KEY);
    window.dispatchEvent(
      new CustomEvent(RECENT_SIGNATURES_EVENT, { detail: [] })
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Synchronizes with backend recent signatures and seeds local list
 */
export const syncRecentSignatures = async (): Promise<RecentUserSignature[]> => {
  try {
    const local = getRecentSignatures();
    const res = await fetch('/api/certificates/signatures/recent');
    if (!res.ok) return local;

    const data = await res.json();
    if (data.success && Array.isArray(data.signatures)) {
      const serverSigs: RecentUserSignature[] = data.signatures;

      // Merge unique by dataUrl
      const map = new Map<string, RecentUserSignature>();
      local.forEach((s) => map.set(s.dataUrl, s));
      serverSigs.forEach((s) => {
        if (!map.has(s.dataUrl)) {
          map.set(s.dataUrl, s);
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.lastUsedAt || b.createdAt).getTime() -
          new Date(a.lastUsedAt || a.createdAt).getTime()
      );

      const trimmed = merged.slice(0, 30);
      localStorage.setItem(RECENT_SIGNATURES_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(
        new CustomEvent(RECENT_SIGNATURES_EVENT, { detail: trimmed })
      );
      return trimmed;
    }
  } catch {
    // If backend unreachable, return local list
  }
  return getRecentSignatures();
};

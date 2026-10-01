import QRCode from 'qrcode';
import { LostItem } from '../types';

export interface QrItemPayload {
  app: 'warwick_lost_found';
  code: string;
  id: string;
  name: string;
  category: string;
  dateFound: string;
  locationFound: string;
  storeLocation: string;
  status: string;
  url: string;
  timestamp: string;
}

/**
 * Generate a structured JSON payload for the item QR code
 */
export function getItemQrPayload(item: LostItem, hotelName: string = 'Warwick Hotel Baha'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const itemUrl = `${origin}/?itemCode=${encodeURIComponent(item.code)}`;

  const payload: QrItemPayload = {
    app: 'warwick_lost_found',
    code: item.code,
    id: item.id,
    name: item.itemName || item.description || 'Lost Item',
    category: item.category || 'General',
    dateFound: item.dateFound || '',
    locationFound: item.locationFound || '',
    storeLocation: item.storeLocation || '',
    status: item.status || 'Stored',
    url: itemUrl,
    timestamp: new Date().toISOString()
  };

  return JSON.stringify(payload);
}

/**
 * Generate QR code as Data URL (PNG)
 */
export async function generateItemQrDataUrl(
  item: LostItem,
  hotelName: string = 'Warwick Hotel Baha',
  options?: {
    width?: number;
    margin?: number;
    color?: { dark: string; light: string };
  }
): Promise<string> {
  const payload = getItemQrPayload(item, hotelName);
  try {
    return await QRCode.toDataURL(payload, {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff'
      }
    });
  } catch (error) {
    console.warn('QR Code full payload generation failed, falling back to simple tag format:', error);
    return await QRCode.toDataURL(`WARWICK-LF:${item.code}`, {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: 'M'
    });
  }
}

/**
 * Parse any raw string from a scanned QR code to extract item code or ID
 */
export function parseScannedQrData(rawText: string): {
  code?: string;
  id?: string;
  raw: string;
} {
  const trimmed = rawText.trim();

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.code || parsed.id) {
        return {
          code: parsed.code,
          id: parsed.id,
          raw: trimmed
        };
      }
    } catch {
      // Not valid JSON, continue to next parsers
    }
  }

  // 2. Check for URL with query params (?itemCode=... or ?id=...)
  try {
    if (trimmed.includes('itemCode=') || trimmed.includes('id=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
      const codeParam = url.searchParams.get('itemCode') || url.searchParams.get('code');
      const idParam = url.searchParams.get('id');
      if (codeParam || idParam) {
        return {
          code: codeParam || undefined,
          id: idParam || undefined,
          raw: trimmed
        };
      }
    }
  } catch {
    // Ignore URL parse error
  }

  // 3. Check for formatted tag prefixes (e.g. WARWICK-LF:LF-2026-08-112 or LF:LF-2026-001)
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.startsWith('LF-') || lastPart.startsWith('STF-') || lastPart.length >= 3) {
      return {
        code: lastPart,
        raw: trimmed
      };
    }
  }

  // 4. Direct LF code format (e.g. LF-2026-08-101)
  const lfMatch = trimmed.match(/LF-\d{4}-\d{2}-\d+|\bLF-[A-Za-z0-9-]+\b/i);
  if (lfMatch) {
    return {
      code: lfMatch[0],
      raw: trimmed
    };
  }

  // 5. Raw string fallback (can be item ID or code)
  return {
    code: trimmed,
    id: trimmed,
    raw: trimmed
  };
}

/**
 * Trigger a download of the QR Code image with a branded label caption
 */
export async function downloadQrCodeImage(
  dataUrl: string,
  itemCode: string,
  itemName?: string
): Promise<void> {
  try {
    if (typeof document === 'undefined') return;

    // Render on canvas to add a neat header & item code tag below QR
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

    const canvas = document.createElement('canvas');
    const padding = 24;
    const headerHeight = 44;
    const footerHeight = 48;
    const size = img.naturalWidth || img.width || 320;

    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + headerHeight + footerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Header Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WARWICK HOTELS & RESORTS', canvas.width / 2, padding + 18);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('LOST & FOUND ITEM TAG', canvas.width / 2, padding + 34);

    // QR Image
    ctx.drawImage(img, padding, padding + headerHeight, size, size);

    // Footer - Item Code Pill
    ctx.fillStyle = '#f1f5f9';
    const pillWidth = canvas.width - padding * 2;
    ctx.fillRect(padding, canvas.height - footerHeight - padding + 8, pillWidth, 36);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(itemCode, canvas.width / 2, canvas.height - footerHeight - padding + 31);

    const fullDataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = fullDataUrl;
    a.download = `QR-TAG-${itemCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    // Fallback direct download
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `QR-TAG-${itemCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
}

/**
 * Play a pleasant scanner confirmation beep using Web Audio API safely
 */
export function playScanSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor || typeof AudioContextConstructor !== 'function') return;

    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContextConstructor();
    } catch {
      return;
    }
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Silently ignore audio context errors if sound is blocked by browser policy or sandboxed iframe
  }
}

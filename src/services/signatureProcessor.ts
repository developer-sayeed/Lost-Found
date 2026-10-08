/**
 * Signature Canvas Image Processing Service
 * Automatically thresholds and strips light-colored / paper backgrounds from uploaded signatures,
 * isolating dark/black/blue ink strokes and producing a clean, anti-aliased transparent PNG.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignatureProcessingOptions {
  imageSrc: string;
  cropBounds?: CropRect | null;
  scalePercent?: number;       // default 100
  scaleWidthPercent?: number;  // default 100
  scaleHeightPercent?: number; // default 100
  offsetX?: number;            // default 0
  offsetY?: number;            // default 0
  rotationDeg?: number;        // default 0
  transparentBg?: boolean;     // default true
  bgThreshold?: number;        // default 215 (or auto-detected)
  inkColor?: string;           // 'original', or hex string like '#0f172a'
  targetWidth?: number;        // default 600
  targetHeight?: number;       // default 200
  boostContrast?: boolean;     // default true
  removeNoise?: boolean;       // default true
}

/**
 * Loads an image from string (DataURL or URL)
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Automatically calculates optimal background luminance threshold and background color
 * using histogram analysis of perimeter margins (which almost always contain paper background).
 */
function analyzePaperBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { paperLum: number; refR: number; refG: number; refB: number; cutoff: number; solidInkLum: number } {
  let sumBgR = 0;
  let sumBgG = 0;
  let sumBgB = 0;
  let countBg = 0;
  const lumDistribution: number[] = [];

  // Sample perimeter margins (top 15%, bottom 15%, left 10%, right 10%)
  const marginX = Math.max(10, Math.floor(width * 0.08));
  const marginY = Math.max(8, Math.floor(height * 0.1));

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 30) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumDistribution.push(lum);

      // Check if on perimeter
      if (x < marginX || x > width - marginX || y < marginY || y > height - marginY) {
        sumBgR += r;
        sumBgG += g;
        sumBgB += b;
        countBg++;
      }
    }
  }

  // Fallback defaults
  let refR = 245;
  let refG = 245;
  let refB = 245;
  if (countBg > 0) {
    refR = sumBgR / countBg;
    refG = sumBgG / countBg;
    refB = sumBgB / countBg;
  }

  const perimeterLum = 0.299 * refR + 0.587 * refG + 0.114 * refB;

  // Sort luminance distribution to find 80th-90th percentile of brightness
  lumDistribution.sort((a, b) => a - b);
  const p85Lum = lumDistribution.length > 0 ? lumDistribution[Math.floor(lumDistribution.length * 0.85)] : 235;

  // The true paper background luminance
  const paperLum = Math.max(160, Math.min(255, Math.max(perimeterLum, p85Lum)));
  // Cutoff threshold: anything within 24 luminance units of paper is pure paper background
  const cutoff = paperLum - 24;
  // Solid ink luminance benchmark
  const solidInkLum = Math.max(15, paperLum - 70);

  return { paperLum, refR, refG, refB, cutoff, solidInkLum };
}

/**
 * Primary processing function: removes light-colored paper background,
 * isolates dark handwritten ink strokes, applies anti-aliasing and returns transparent PNG.
 */
export async function processUploadedSignature(opts: SignatureProcessingOptions): Promise<string> {
  if (!opts.imageSrc) return '';

  try {
    const img = await loadImage(opts.imageSrc);

    const targetWidth = opts.targetWidth || 600;
    const targetHeight = opts.targetHeight || 200;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return opts.imageSrc;

    // Determine source crop
    const crop = opts.cropBounds;
    const srcX = crop ? Math.max(0, crop.x) : 0;
    const srcY = crop ? Math.max(0, crop.y) : 0;
    const srcW = crop && crop.width > 10 ? Math.min(img.naturalWidth - srcX, crop.width) : img.naturalWidth;
    const srcH = crop && crop.height > 10 ? Math.min(img.naturalHeight - srcY, crop.height) : img.naturalHeight;

    if (srcW <= 0 || srcH <= 0) return opts.imageSrc;

    // Aspect ratio fitting
    const aspect = srcW / srcH;
    let drawW = targetWidth * 0.74;
    let drawH = drawW / aspect;

    if (drawH > targetHeight * 0.78) {
      drawH = targetHeight * 0.78;
      drawW = drawH * aspect;
    }

    // Scaling factors
    const overallFactor = Math.max(0.15, Math.min((opts.scalePercent ?? 100) / 100, 4.0));
    const widthFactor = Math.max(0.4, Math.min((opts.scaleWidthPercent ?? 100) / 100, 2.5));
    const heightFactor = Math.max(0.4, Math.min((opts.scaleHeightPercent ?? 100) / 100, 2.5));

    drawW = drawW * overallFactor * widthFactor;
    drawH = drawH * overallFactor * heightFactor;

    ctx.save();
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Center & Translation
    const centerX = targetWidth / 2 + (opts.offsetX ?? 0);
    const centerY = targetHeight / 2 + (opts.offsetY ?? 0);

    ctx.translate(centerX, centerY);
    if (opts.rotationDeg && opts.rotationDeg !== 0) {
      ctx.rotate((opts.rotationDeg * Math.PI) / 180);
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcW,
      srcH,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    ctx.restore();

    // Pixel Manipulation: Background Thresholding & Ink Isolation
    const transparentBg = opts.transparentBg ?? true;
    const shouldRecolor = Boolean(opts.inkColor && opts.inkColor !== 'original');

    if (transparentBg || shouldRecolor) {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      // Target ink recolor values
      let targetR = 15;
      let targetG = 23;
      let targetB = 42; // Deep executive slate (#0f172a)

      if (shouldRecolor && opts.inkColor?.startsWith('#')) {
        const hex = opts.inkColor.slice(1);
        if (hex.length === 6) {
          targetR = parseInt(hex.substring(0, 2), 16);
          targetG = parseInt(hex.substring(2, 4), 16);
          targetB = parseInt(hex.substring(4, 6), 16);
        }
      }

      // Analyze paper background parameters
      const { paperLum, refR, refG, refB, cutoff, solidInkLum } = analyzePaperBackground(
        data,
        targetWidth,
        targetHeight
      );

      // User threshold override if provided
      const effectiveCutoff = opts.bgThreshold !== undefined && opts.bgThreshold > 50
        ? Math.min(cutoff, opts.bgThreshold)
        : cutoff;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const colorDistToPaper = Math.hypot(r - refR, g - refG, b - refB);

        if (transparentBg) {
          // If pixel matches paper background brightness or paper color closely
          if (lum >= effectiveCutoff || (colorDistToPaper < 34 && lum > paperLum - 48)) {
            data[i + 3] = 0; // Pure 100% transparent!
            continue;
          }

          // Darkness relative to paper background
          const darkness = paperLum - lum;
          if (darkness < 20) {
            // Paper grain / faint shadow
            data[i + 3] = 0;
            continue;
          }

          // Anti-aliased soft alpha gradient for stroke edges
          const inkSpan = Math.max(1, paperLum - solidInkLum - 20);
          const inkFactor = Math.min(1.0, (darkness - 20) / inkSpan);
          const calculatedAlpha = Math.round(255 * (0.35 + 0.65 * inkFactor));
          data[i + 3] = Math.min(a, calculatedAlpha);
        }

        // Ink Isolation & Color Boosting
        if (data[i + 3] > 0) {
          if (shouldRecolor) {
            data[i] = targetR;
            data[i + 1] = targetG;
            data[i + 2] = targetB;
          } else {
            // Natural ink enhancement
            // Check for blue pen ink (ballpoint / fountain)
            if (b > r + 10 && b > g) {
              data[i] = Math.max(10, Math.round(r * 0.7));
              data[i + 1] = Math.max(25, Math.round(g * 0.78));
              data[i + 2] = Math.min(235, Math.round(b * 1.15));
            } else {
              // Rich black / charcoal ink: boost darkness of strokes
              const lumFactor = Math.min(1.0, lum / Math.max(1, paperLum - 30));
              data[i] = Math.round(r * lumFactor * 0.6);
              data[i + 1] = Math.round(g * lumFactor * 0.6);
              data[i + 2] = Math.round(b * lumFactor * 0.65);
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('processUploadedSignature error:', err);
    return opts.imageSrc;
  }
}

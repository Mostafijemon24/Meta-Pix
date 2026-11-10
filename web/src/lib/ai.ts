import { emptyFields, type Fields, type Format, type Orient, type Platform, type ResizeMode } from './presets';
import { suggestMetadata } from './suggest';

export type AiOptimizeResult = {
  fields: Fields;
  platform: Platform;
  orient: Orient;
  format: Format;
  resize: ResizeMode;
  quality: number;
  reason?: string;
};

/** Downscale + JPEG-encode so free-tier vision requests stay small. */
export async function imageToDataUrl(blob: Blob, maxEdge = 1024, quality = 0.82): Promise<string> {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return c.toDataURL('image/jpeg', quality);
}

function normalizeFields(raw: Partial<Fields> | undefined, fileName: string): Fields {
  const base = suggestMetadata(fileName);
  const out = emptyFields();
  for (const k of Object.keys(out) as (keyof Fields)[]) {
    const v = raw?.[k];
    out[k] = typeof v === 'string' && v.trim() ? v.trim() : base[k];
  }
  return out;
}

const PLATFORMS = new Set(['original', 'facebook', 'instagram', 'linkedin', 'x', 'pinterest', 'custom']);
const ORIENTS = new Set(['h', 's', 'v', 'long']);
const FORMATS = new Set(['jpeg', 'png', 'webp']);
const RESIZES = new Set(['fill', 'fit']);

export async function requestAiOptimize(opts: {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}): Promise<AiOptimizeResult> {
  const image = await imageToDataUrl(opts.blob);
  const res = await fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      fileName: opts.fileName,
      width: opts.width,
      height: opts.height,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === 'string' ? err.error : 'AI optimize failed');
  }

  const data = await res.json();
  const fields = normalizeFields(data.fields, opts.fileName);
  const platform = PLATFORMS.has(data.platform) ? (data.platform as Platform) : 'instagram';
  const orient = ORIENTS.has(data.orient) ? (data.orient as Orient) : 's';
  const format = FORMATS.has(data.format) ? (data.format as Format) : 'webp';
  const resize = RESIZES.has(data.resize) ? (data.resize as ResizeMode) : 'fill';
  const quality = Math.min(100, Math.max(10, Math.round(Number(data.quality) || 90)));

  return {
    fields,
    platform,
    orient,
    format,
    resize,
    quality,
    reason: typeof data.reason === 'string' ? data.reason : undefined,
  };
}

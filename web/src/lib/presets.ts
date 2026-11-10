export type Orient = 'h' | 's' | 'v' | 'long';
export type PlatformKey = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'pinterest';
export type Platform = 'original' | PlatformKey | 'custom';
export type Format = 'jpeg' | 'png' | 'webp';
export type ResizeMode = 'fill' | 'fit';
export type MetaMode = 'keep' | 'update' | 'remove';

export const PRESETS: Record<PlatformKey, { name: string; sizes: Partial<Record<Orient, [number, number]>> }> = {
  facebook: { name: 'Facebook', sizes: { h: [1200, 630], s: [1080, 1080], v: [1080, 1350] } },
  instagram: { name: 'Instagram', sizes: { h: [1080, 566], s: [1080, 1080], v: [1080, 1350] } },
  linkedin: { name: 'LinkedIn', sizes: { h: [1200, 627], s: [1080, 1080], v: [1080, 1350] } },
  x: { name: 'X', sizes: { h: [1600, 900], s: [1080, 1080], v: [1080, 1350] } },
  pinterest: { name: 'Pinterest', sizes: { h: [1500, 1000], s: [1000, 1000], v: [1000, 1500], long: [1000, 2100] } },
};

export const ORIENT_LABEL: Record<Orient, string> = { h: 'Horizontal', s: 'Square', v: 'Vertical', long: 'Long vertical' };

export const FMT_LABEL: Record<Format, string> = { jpeg: 'JPEG', png: 'PNG', webp: 'WebP' };
export const EXT: Record<Format, string> = { jpeg: '.jpg', png: '.png', webp: '.webp' };
export const MIME: Record<Format, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export const CORE_FIELDS = [
  ['fileName', 'File name', 'e.g. aurora-mountain-lake'],
  ['title', 'Title', 'Image title'],
  ['alt', 'Alt text', 'Describe the image'],
] as const;
export const EXTRA_FIELDS = [
  ['description', 'Description', 'Short description'],
  ['keyword', 'Focus keyword', 'Main keyword'],
  ['related', 'Related keywords', 'Comma-separated'],
  ['caption', 'Caption', 'Optional caption'],
  ['tags', 'Tags', 'Comma-separated'],
] as const;

export type FieldKey = (typeof CORE_FIELDS)[number][0] | (typeof EXTRA_FIELDS)[number][0];
export type Fields = Record<FieldKey, string>;
export type Copyright = { creator: string; owner: string; notice: string };

export const emptyFields = (): Fields =>
  [...CORE_FIELDS, ...EXTRA_FIELDS].reduce((a, [k]) => ((a[k] = ''), a), {} as Fields);

export const slug = (t: string) =>
  (t || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);

/** Output dimensions for the current size selection. */
export function outputSize(
  platform: Platform,
  orient: Orient,
  custom: { w: number | string; h: number | string },
  original: [number, number],
): [number, number] {
  if (platform === 'original') return original;
  if (platform === 'custom') return [Math.max(1, Math.round(+custom.w || 1)), Math.max(1, Math.round(+custom.h || 1))];
  const z = PRESETS[platform].sizes;
  return z[orient] || z.h!;
}

/** Rough output size estimate (bits per pixel model from the design). */
export function estimateBytes(w: number, h: number, format: Format, quality: number) {
  const q = quality / 100;
  const bpp = format === 'png' ? 9.5 : format === 'webp' ? 0.45 + 2.6 * q ** 3 : 0.6 + 3.4 * q ** 3;
  return (w * h * bpp) / 8;
}

export function formatBytes(b: number) {
  return b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1000)) + ' KB';
}

/**
 * Where the source image sits inside the output frame.
 * fill = cover (crop edges), fit = contain (pad with background).
 * Returns the image rect in output-pixel coordinates.
 */
export function placeImage(fw: number, fh: number, iw: number, ih: number, mode: ResizeMode) {
  const scale = mode === 'fill' ? Math.max(fw / iw, fh / ih) : Math.min(fw / iw, fh / ih);
  const w = iw * scale, h = ih * scale;
  return { x: (fw - w) / 2, y: (fh - h) / 2, w, h };
}

/** Fit a frame of aspect A inside a MW×MH box. */
export function fitBox(MW: number, MH: number, A: number): [number, number] {
  return A >= MW / MH ? [MW, MW / A] : [MH * A, MH];
}

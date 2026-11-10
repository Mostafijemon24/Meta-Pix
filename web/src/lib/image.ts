import { applyMetadata, readSourceMeta, type MetaPayload, type SourceMeta } from './metadata';
import { MIME, placeImage, type Format, type MetaMode, type ResizeMode } from './presets';

export type SourceImage = {
  id: string;
  name: string; // original file name with extension
  bytes: number;
  type: string; // mime
  w: number;
  h: number;
  url: string; // object URL for display
  blob: Blob;
  meta: SourceMeta;
};

export async function loadSource(blob: Blob, name: string, id: string = crypto.randomUUID()): Promise<SourceImage> {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const { width: w, height: h } = bmp;
  bmp.close();
  const meta = readSourceMeta(new Uint8Array(await blob.arrayBuffer()));
  return { id, name, bytes: blob.size, type: blob.type, w, h, url: URL.createObjectURL(blob), blob, meta };
}

export type RenderOpts = {
  size: [number, number];
  resize: ResizeMode;
  format: Format;
  quality: number; // 10..100
  metaMode: MetaMode;
  payload: MetaPayload;
};

export type RenderResult = { blob: Blob; format: Format; fellBack: boolean };

async function drawTo(src: SourceImage, [W, H]: [number, number], resize: ResizeMode, bg: string | null) {
  const bmp = await createImageBitmap(src.blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  if (bg) (ctx.fillStyle = bg), ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const r = placeImage(W, H, bmp.width, bmp.height, resize);
  ctx.drawImage(bmp, r.x, r.y, r.w, r.h);
  bmp.close();
  return canvas;
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed'))), type, q));

/** Resize, encode and embed metadata. Never touches the original file. */
export async function renderExport(src: SourceImage, o: RenderOpts): Promise<RenderResult> {
  // JPEG has no alpha: pad with white. PNG/WebP keep transparency.
  const canvas = await drawTo(src, o.size, o.resize, o.format === 'jpeg' ? '#FFFFFF' : null);
  let format = o.format;
  let blob = await toBlob(canvas, MIME[format], format === 'png' ? undefined : o.quality / 100);
  let fellBack = false;
  if (blob.type !== MIME[format]) {
    // Browser can't encode this format (e.g. WebP on older Safari) — it gave PNG.
    format = 'png';
    fellBack = true;
  }
  const bytes = applyMetadata(new Uint8Array(await blob.arrayBuffer()), format, o.size, o.metaMode, src.meta, o.payload);
  blob = new Blob([bytes as BlobPart], { type: MIME[format] });
  return { blob, format, fellBack };
}

/** Small JPEG data URL used for history/recent thumbnails. */
export async function thumbnail(blob: Blob, max = 160): Promise<string> {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * s));
  c.height = Math.max(1, Math.round(bmp.height * s));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL('image/jpeg', 0.8);
}

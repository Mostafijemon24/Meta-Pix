// Embedded metadata (EXIF / IPTC / XMP) read + write for JPEG, PNG and WebP.
// Works on raw bytes so it runs in the browser and in tests.

import type { Copyright, Fields, Format, MetaMode } from './presets';

export type SourceMeta = {
  exif?: Uint8Array; // raw TIFF block (no "Exif\0\0" prefix)
  xmp?: string; // XMP packet
  iptc?: Uint8Array; // full JPEG APP13 payload (Photoshop IRB)
};

export type MetaPayload = { fields: Fields; copyright: Copyright | null };

const enc = new TextEncoder();
const dec = new TextDecoder();
const XMP_NS = 'http://ns.adobe.com/xap/1.0/\0';
const EXIF_HDR = 'Exif\0\0';

const startsWith = (b: Uint8Array, off: number, s: string) => {
  for (let i = 0; i < s.length; i++) if (b[off + i] !== s.charCodeAt(i)) return false;
  return true;
};

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
};

// ───────────────────────── XMP packet ─────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const alt = (tag: string, v: string) =>
  v ? `<${tag}><rdf:Alt><rdf:li xml:lang="x-default">${esc(v)}</rdf:li></rdf:Alt></${tag}>` : '';
const bag = (tag: string, kind: 'Bag' | 'Seq', vs: string[]) =>
  vs.length ? `<${tag}><rdf:${kind}>${vs.map((v) => `<rdf:li>${esc(v)}</rdf:li>`).join('')}</rdf:${kind}></${tag}>` : '';
const simple = (tag: string, v: string) => (v ? `<${tag}>${esc(v)}</${tag}>` : '');

/** True when there is anything new to embed. */
export function hasPayload(p: MetaPayload) {
  const f = p.fields;
  const any = [f.title, f.alt, f.description, f.keyword, f.related, f.caption, f.tags].some((v) => v.trim());
  return any || !!(p.copyright && Object.values(p.copyright).some((v) => v.trim()));
}

export function buildXmp({ fields: f, copyright: c }: MetaPayload): string {
  const subjects = [...new Set([f.keyword.trim(), ...list(f.related), ...list(f.tags)].filter(Boolean))];
  const body = [
    alt('dc:title', f.title.trim()),
    alt('dc:description', f.description.trim()),
    alt('Iptc4xmpCore:AltTextAccessibility', f.alt.trim()),
    simple('photoshop:Headline', f.caption.trim()),
    bag('dc:subject', 'Bag', subjects),
    simple('metapix:FocusKeyword', f.keyword.trim()),
    c ? bag('dc:creator', 'Seq', c.creator.trim() ? [c.creator.trim()] : []) : '',
    c ? alt('dc:rights', c.notice.trim()) : '',
    c ? bag('xmpRights:Owner', 'Bag', c.owner.trim() ? [c.owner.trim()] : []) : '',
    c ? simple('photoshop:Credit', c.creator.trim()) : '',
    c && c.notice.trim() ? '<xmpRights:Marked>True</xmpRights:Marked>' : '',
  ].join('');
  return (
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    '<rdf:Description rdf:about=""' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
    ' xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"' +
    ' xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"' +
    ' xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"' +
    ' xmlns:metapix="https://metapix.app/ns/1.0/">' +
    body +
    '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
  );
}

// ───────────────────────── Reading source metadata ─────────────────────────

/** Extract EXIF / XMP / IPTC from a JPEG file. Other formats return {}. */
export function readSourceMeta(b: Uint8Array): SourceMeta {
  const out: SourceMeta = {};
  if (b[0] !== 0xff || b[1] !== 0xd8) return out;
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const m = b[i + 1];
    if (m === 0xda || m === 0xd9) break; // start of scan / end
    const len = (b[i + 2] << 8) | b[i + 3];
    const s = i + 4, e = i + 2 + len;
    if (m === 0xe1 && startsWith(b, s, EXIF_HDR) && !out.exif) out.exif = b.slice(s + 6, e);
    else if (m === 0xe1 && startsWith(b, s, XMP_NS) && !out.xmp) out.xmp = dec.decode(b.slice(s + XMP_NS.length, e));
    else if (m === 0xed && !out.iptc) out.iptc = b.slice(s, e);
    i = e;
  }
  return out;
}

/** The browser already applied EXIF orientation when decoding, so reset it to 1. */
export function resetOrientation(tiff: Uint8Array): Uint8Array {
  const t = tiff.slice();
  if (t.length < 8) return t;
  const le = t[0] === 0x49;
  const dv = new DataView(t.buffer, t.byteOffset, t.byteLength);
  const u16 = (o: number) => dv.getUint16(o, le);
  const ifd = dv.getUint32(4, le);
  if (ifd + 2 > t.length) return t;
  const n = u16(ifd);
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 12 > t.length) break;
    if (u16(e) === 0x0112) dv.setUint16(e + 8, 1, le);
  }
  return t;
}

// ───────────────────────── JPEG ─────────────────────────

function jpegSegment(marker: number, payload: Uint8Array) {
  const len = payload.length + 2;
  if (len > 0xffff) return new Uint8Array(0); // too large for one segment — skip
  return concat([new Uint8Array([0xff, marker, len >> 8, len & 0xff]), payload]);
}

function writeJpeg(img: Uint8Array, exif?: Uint8Array, xmp?: string, iptc?: Uint8Array) {
  // Insert after SOI and the encoder's APP0 (JFIF) if present.
  let at = 2;
  if (img[2] === 0xff && img[3] === 0xe0) at = 4 + ((img[4] << 8) | img[5]);
  const segs: Uint8Array[] = [];
  if (exif) segs.push(jpegSegment(0xe1, concat([enc.encode(EXIF_HDR), exif])));
  if (xmp) segs.push(jpegSegment(0xe1, concat([enc.encode(XMP_NS), enc.encode(xmp)])));
  if (iptc) segs.push(jpegSegment(0xed, iptc));
  return concat([img.slice(0, at), ...segs, img.slice(at)]);
}

// ───────────────────────── PNG ─────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(b: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const head = new Uint8Array(8);
  const dv = new DataView(head.buffer);
  dv.setUint32(0, data.length);
  head.set(enc.encode(type), 4);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(concat([head.slice(4), data])));
  return concat([head, data, crc]);
}

const iTXt = (key: string, text: string) =>
  pngChunk('iTXt', concat([enc.encode(key), new Uint8Array([0, 0, 0, 0, 0]), enc.encode(text)]));

function writePng(img: Uint8Array, exif?: Uint8Array, xmp?: string, p?: MetaPayload) {
  const ihdrEnd = 8 + 8 + 13 + 4;
  const chunks: Uint8Array[] = [];
  if (exif) chunks.push(pngChunk('eXIf', exif));
  if (xmp) chunks.push(iTXt('XML:com.adobe.xmp', xmp));
  if (p) {
    // Plain PNG text keys, which many viewers show directly.
    const f = p.fields, c = p.copyright;
    if (f.title.trim()) chunks.push(iTXt('Title', f.title.trim()));
    if (f.description.trim()) chunks.push(iTXt('Description', f.description.trim()));
    if (c?.creator.trim()) chunks.push(iTXt('Author', c.creator.trim()));
    if (c?.notice.trim()) chunks.push(iTXt('Copyright', c.notice.trim()));
  }
  return concat([img.slice(0, ihdrEnd), ...chunks, img.slice(ihdrEnd)]);
}

// ───────────────────────── WebP ─────────────────────────

function riffChunk(fourcc: string, data: Uint8Array) {
  const head = new Uint8Array(8);
  head.set(enc.encode(fourcc), 0);
  new DataView(head.buffer).setUint32(4, data.length, true);
  return concat([head, data, data.length & 1 ? new Uint8Array(1) : new Uint8Array(0)]);
}

function writeWebp(img: Uint8Array, w: number, h: number, exif?: Uint8Array, xmp?: string) {
  if (!startsWith(img, 0, 'RIFF') || !startsWith(img, 8, 'WEBP')) return img;
  // Split into chunks.
  const chunks: { id: string; data: Uint8Array }[] = [];
  for (let i = 12; i + 8 <= img.length; ) {
    const id = dec.decode(img.slice(i, i + 4));
    const len = new DataView(img.buffer, img.byteOffset + i + 4, 4).getUint32(0, true);
    chunks.push({ id, data: img.slice(i + 8, i + 8 + len) });
    i += 8 + len + (len & 1);
  }
  let vp8x = chunks.find((c) => c.id === 'VP8X');
  if (!vp8x) {
    let alpha = chunks.some((c) => c.id === 'ALPH');
    const l = chunks.find((c) => c.id === 'VP8L');
    if (l && l.data.length >= 5) alpha = alpha || ((l.data[4] >> 4) & 1) === 1;
    const d = new Uint8Array(10);
    d[0] = alpha ? 0x10 : 0;
    const W = w - 1, H = h - 1;
    d[4] = W & 0xff; d[5] = (W >> 8) & 0xff; d[6] = (W >> 16) & 0xff;
    d[7] = H & 0xff; d[8] = (H >> 8) & 0xff; d[9] = (H >> 16) & 0xff;
    vp8x = { id: 'VP8X', data: d };
    chunks.unshift(vp8x);
  }
  const rest = chunks.filter((c) => c.id !== 'EXIF' && c.id !== 'XMP ');
  if (exif) (rest.push({ id: 'EXIF', data: exif }), (vp8x.data[0] |= 0x08));
  if (xmp) (rest.push({ id: 'XMP ', data: enc.encode(xmp) }), (vp8x.data[0] |= 0x04));
  const body = concat([enc.encode('WEBP'), ...rest.map((c) => riffChunk(c.id, c.data))]);
  const head = new Uint8Array(8);
  head.set(enc.encode('RIFF'), 0);
  new DataView(head.buffer).setUint32(4, body.length, true);
  return concat([head, body]);
}

// ───────────────────────── Public entry ─────────────────────────

/**
 * Apply the chosen metadata policy to freshly encoded image bytes
 * (which carry no metadata of their own).
 */
export function applyMetadata(
  img: Uint8Array,
  format: Format,
  size: [number, number],
  mode: MetaMode,
  source: SourceMeta,
  payload: MetaPayload,
): Uint8Array {
  if (mode === 'remove') return img;
  const exif = source.exif ? resetOrientation(source.exif) : undefined;
  const ours = hasPayload(payload);
  // Our XMP replaces the original packet when there is something new to write.
  const xmp = ours ? buildXmp(payload) : source.xmp;
  if (format === 'jpeg') return writeJpeg(img, exif, xmp, source.iptc);
  if (format === 'png') return writePng(img, exif, xmp, ours ? payload : undefined);
  return writeWebp(img, size[0], size[1], exif, xmp);
}

import { describe, expect, it } from 'vitest';
import { applyMetadata, buildXmp, crc32, readSourceMeta, resetOrientation } from './metadata';
import { emptyFields, outputSize, placeImage } from './presets';

const enc = new TextEncoder();
const dec = new TextDecoder();
const cat = (...p: Uint8Array[]) => {
  const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let i = 0;
  for (const x of p) (o.set(x, i), (i += x.length));
  return o;
};
const seg = (m: number, payload: Uint8Array) => cat(new Uint8Array([0xff, m, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload);

// Minimal TIFF: little-endian, one IFD entry = Orientation(6).
const tiff = () => {
  const b = new Uint8Array(8 + 2 + 12 + 4);
  const dv = new DataView(b.buffer);
  b.set([0x49, 0x49, 42, 0]);
  dv.setUint32(4, 8, true);
  dv.setUint16(8, 1, true);
  dv.setUint16(10, 0x0112, true);
  dv.setUint16(12, 3, true);
  dv.setUint32(14, 1, true);
  dv.setUint16(18, 6, true);
  return b;
};

const fakeJpeg = (extra: Uint8Array[] = []) =>
  cat(new Uint8Array([0xff, 0xd8]), seg(0xe0, enc.encode('JFIF\0\x01\x01')), ...extra, new Uint8Array([0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9]));

const payload = () => {
  const f = emptyFields();
  f.title = 'Aurora & Lake';
  f.keyword = 'aurora';
  f.tags = 'night, aurora, lake';
  return { fields: f, copyright: { creator: 'Mostafij Emon', owner: 'Mostafij Emon', notice: '© Mostafij Emon' } };
};

describe('xmp', () => {
  it('escapes and dedupes subjects', () => {
    const x = buildXmp(payload());
    expect(x).toContain('Aurora &amp; Lake');
    expect(x.match(/<rdf:li>aurora<\/rdf:li>/g)).toHaveLength(1);
    expect(x).toContain('© Mostafij Emon');
  });
});

describe('jpeg', () => {
  const src = fakeJpeg([seg(0xe1, cat(enc.encode('Exif\0\0'), tiff())), seg(0xed, enc.encode('Photoshop 3.0\0IPTC'))]);

  it('reads exif + iptc from source', () => {
    const m = readSourceMeta(src);
    expect(m.exif?.length).toBe(tiff().length);
    expect(dec.decode(m.iptc!)).toContain('IPTC');
  });

  it('resets orientation to 1', () => {
    const t = resetOrientation(tiff());
    expect(new DataView(t.buffer).getUint16(18, true)).toBe(1);
  });

  it('remove all leaves encoder output untouched', () => {
    const out = fakeJpeg();
    expect(applyMetadata(out, 'jpeg', [10, 10], 'remove', readSourceMeta(src), payload())).toBe(out);
  });

  it('keep writes exif, xmp and iptc after APP0', () => {
    const out = applyMetadata(fakeJpeg(), 'jpeg', [10, 10], 'keep', readSourceMeta(src), payload());
    const back = readSourceMeta(out);
    expect(back.exif).toBeDefined();
    expect(back.iptc).toBeDefined();
    expect(back.xmp).toContain('Aurora &amp; Lake');
    expect(out[2]).toBe(0xff);
    expect(out[3]).toBe(0xe0); // JFIF still first
  });

  it('keeps original xmp when nothing new was entered', () => {
    const withXmp = fakeJpeg([seg(0xe1, cat(enc.encode('http://ns.adobe.com/xap/1.0/\0'), enc.encode('<x>orig</x>')))]);
    const out = applyMetadata(fakeJpeg(), 'jpeg', [10, 10], 'keep', readSourceMeta(withXmp), { fields: emptyFields(), copyright: null });
    expect(readSourceMeta(out).xmp).toBe('<x>orig</x>');
  });
});

describe('png', () => {
  const ihdr = (() => {
    const data = new Uint8Array(13);
    const type = enc.encode('IHDR');
    const len = new Uint8Array([0, 0, 0, 13]);
    const crc = new Uint8Array(4);
    new DataView(crc.buffer).setUint32(0, crc32(cat(type, data)));
    return cat(len, type, data, crc);
  })();
  const png = cat(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ihdr, new Uint8Array([0, 0, 0, 0]), enc.encode('IEND'), new Uint8Array(4));

  it('inserts iTXt chunks with valid CRC after IHDR', () => {
    const out = applyMetadata(png, 'png', [10, 10], 'keep', {}, payload());
    const s = dec.decode(out);
    expect(s).toContain('XML:com.adobe.xmp');
    expect(s).toContain('Author');
    expect(s.indexOf('iTXt')).toBeGreaterThan(s.indexOf('IHDR'));
    // Verify first inserted chunk's CRC.
    const at = 33;
    const len = new DataView(out.buffer).getUint32(at);
    const crc = new DataView(out.buffer).getUint32(at + 8 + len);
    expect(crc).toBe(crc32(out.slice(at + 4, at + 8 + len)));
  });
});

describe('webp', () => {
  const vp8 = cat(enc.encode('VP8 '), new Uint8Array([3, 0, 0, 0, 1, 2, 3, 0]));
  const webp = cat(enc.encode('RIFF'), new Uint8Array([4 + vp8.length, 0, 0, 0]), enc.encode('WEBP'), vp8);

  it('adds VP8X with XMP flag and fixes RIFF size', () => {
    const out = applyMetadata(webp, 'webp', [300, 200], 'keep', { exif: tiff() }, payload());
    const dv = new DataView(out.buffer);
    expect(dec.decode(out.slice(12, 16))).toBe('VP8X');
    expect(out[20] & 0x0c).toBe(0x0c); // XMP + EXIF flags
    expect(dv.getUint32(4, true)).toBe(out.length - 8);
    expect(dv.getUint16(24, true) | (out[26] << 16)).toBe(299);
    expect(dec.decode(out)).toContain('XMP ');
  });
});

describe('sizing', () => {
  it('picks preset sizes and falls back to horizontal', () => {
    expect(outputSize('pinterest', 'long', { w: 1, h: 1 }, [10, 10])).toEqual([1000, 2100]);
    expect(outputSize('facebook', 'long', { w: 1, h: 1 }, [10, 10])).toEqual([1200, 630]);
    expect(outputSize('original', 'h', { w: 1, h: 1 }, [640, 480])).toEqual([640, 480]);
    expect(outputSize('custom', 'h', { w: '0', h: 50 }, [1, 1])).toEqual([1, 50]);
  });
  it('never stretches: crop covers, fit contains, both keep aspect', () => {
    const fill = placeImage(1080, 1080, 1200, 800, 'fill');
    expect(fill.h).toBe(1080);
    expect(fill.w / fill.h).toBeCloseTo(1.5);
    const fit = placeImage(1080, 1080, 1200, 800, 'fit');
    expect(fit.w).toBe(1080);
    expect(fit.y).toBeCloseTo(180);
  });
});

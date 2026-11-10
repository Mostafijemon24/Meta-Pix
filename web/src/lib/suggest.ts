// Filename-based fallback when the OpenRouter call is unavailable.

import { slug, type Fields } from './presets';

const NOISE = new Set([
  'img', 'image', 'photo', 'pic', 'ai', 'dsc', 'pxl', 'screenshot', 'final', 'copy', 'edit', 'export', 'untitled',
]);

const title = (w: string[]) => w.map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');

export function suggestMetadata(fileName: string): Fields {
  const base = fileName.replace(/\.[^.]+$/, '');
  let words = base
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 1 && !NOISE.has(w));
  if (!words.length) words = ['social', 'media', 'image'];
  const t = title(words);
  const phrase = words.join(' ');
  return {
    fileName: slug(phrase),
    title: t,
    alt: `${t} — high-quality image prepared for social media`,
    description: `${t}, optimized and sized for sharing on social platforms.`,
    keyword: phrase,
    related: [...words, `${phrase} image`].slice(0, 5).join(', '),
    caption: `${t}.`,
    tags: [...words, 'social media'].join(', '),
  };
}

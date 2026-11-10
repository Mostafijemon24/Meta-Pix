export const SITE_NAME = 'Meta Pix';
export const SITE_TAGLINE = 'Your Images. Perfectly Optimized.';
export const SITE_DESCRIPTION =
  'Meta Pix turns any image into SEO-ready, social-media-ready exports. AI fills metadata, resizes for Instagram, Facebook, LinkedIn, X and Pinterest, then exports JPEG, PNG or WebP — hosted on Vercel.';

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://meta-pix.vercel.app').replace(/\/$/, '');
}

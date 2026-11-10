import type { Metadata } from 'next';
import MetaPixApp from '../../studio/MetaPixApp';

export const metadata: Metadata = {
  title: 'Studio — Bulk SEO Image Optimizer',
  description:
    'Bulk-upload images, auto-generate SEO filenames, alt text, titles and keywords with OpenRouter, then export WebP/JPEG/PNG or ZIP.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/studio' },
};

export default function StudioPage() {
  return <MetaPixApp />;
}

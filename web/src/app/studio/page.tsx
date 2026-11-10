import type { Metadata } from 'next';
import MetaPixApp from '../../studio/MetaPixApp';

export const metadata: Metadata = {
  title: 'Studio',
  description:
    'Open Meta Pix Studio — AI SEO metadata, social resize, and JPEG / PNG / WebP export in the browser.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/studio' },
};

export default function StudioPage() {
  return <MetaPixApp />;
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Meta Pix — Your Images. Perfectly Optimized.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(135deg, #0b0c18 0%, #1a1635 55%, #2a1f55 100%)',
          color: '#f4f5fb',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #635BFF, #8B5CF6)',
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>Meta Pix</div>
        <div style={{ fontSize: 32, marginTop: 16, color: '#c8cbe0' }}>Your Images. Perfectly Optimized.</div>
        <div style={{ fontSize: 22, marginTop: 28, color: '#9ea3c0' }}>
          AI SEO metadata · Social sizes · JPEG / PNG / WebP
        </div>
      </div>
    ),
    { ...size },
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '../lib/site';

const features = [
  {
    title: 'AI SEO metadata',
    body: 'OpenRouter free vision models read your image and fill title, alt text, keywords, caption and tags.',
  },
  {
    title: 'Social-ready sizes',
    body: 'One tap presets for Instagram, Facebook, LinkedIn, X and Pinterest — crop to fill or fit with border.',
  },
  {
    title: 'Clean exports',
    body: 'JPEG, PNG or WebP with optional copyright. Keep, update, or strip EXIF / IPTC / XMP.',
  },
];

const steps = [
  { n: '01', t: 'Import', d: 'Drop any photo or AI-generated image. The original stays untouched.' },
  { n: '02', t: 'Auto optimize', d: 'AI fills SEO fields and suggests the best platform size and format.' },
  { n: '03', t: 'Export', d: 'Download a social-ready file with metadata embedded where supported.' },
];

export default function HomePage() {
  return (
    <main>
      <header className="mp-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontWeight: 800 }}>
          <Image src="/icon-192.png" alt="" width={36} height={36} priority style={{ borderRadius: 10 }} />
          <span style={{ fontSize: '1.15rem' }}>{SITE_NAME}</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="#features" className="mp-btn mp-btn-ghost" style={{ height: '2.6rem', padding: '0 1rem' }}>
            Features
          </a>
          <Link href="/studio" className="mp-btn mp-btn-primary" style={{ height: '2.6rem', padding: '0 1rem' }}>
            Open Studio
          </Link>
        </nav>
      </header>

      <section className="mp-container" style={{ minHeight: '78dvh', display: 'grid', alignContent: 'center', gap: '1.25rem', padding: '2rem 0 4rem' }}>
        <p className="mp-eyebrow mp-fade">
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: 'var(--mp-primary)',
              boxShadow: '0 0 0 4px rgba(99,91,255,.25)',
            }}
          />
          SEO image studio · Powered by OpenRouter
        </p>
        <h1
          className="mp-fade-delay"
          style={{
            margin: 0,
            fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            fontWeight: 800,
            maxWidth: '11ch',
          }}
        >
          {SITE_NAME}
        </h1>
        <p className="mp-fade-delay" style={{ margin: 0, fontSize: 'clamp(1.15rem, 2.4vw, 1.55rem)', fontWeight: 700, color: '#e7e9f5' }}>
          {SITE_TAGLINE}
        </p>
        <p className="mp-fade-delay-2" style={{ margin: 0, maxWidth: '34rem', fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--mp-muted)' }}>
          Upload once. AI writes SEO metadata, picks the right social size, and exports WebP, JPEG or PNG — ready for search and feeds.
        </p>
        <div className="mp-fade-delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Link href="/studio" className="mp-btn mp-btn-primary">
            Start free in Studio
          </Link>
          <a href="#how" className="mp-btn mp-btn-ghost">
            How it works
          </a>
        </div>
      </section>

      <section id="features" className="mp-section" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--mp-line)', borderBottom: '1px solid var(--mp-line)' }}>
        <div className="mp-container">
          <h2 style={{ margin: '0 0 0.6rem', fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', letterSpacing: '-0.03em' }}>Built for image SEO</h2>
          <p style={{ margin: '0 0 2.5rem', color: 'var(--mp-muted)', maxWidth: 540, lineHeight: 1.6 }}>
            Meta Pix is not just a resizer. It prepares every export for discovery and sharing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {features.map((f) => (
              <article
                key={f.title}
                style={{
                  padding: '1.4rem',
                  borderRadius: 20,
                  background: 'var(--mp-surface)',
                  border: '1px solid var(--mp-line)',
                }}
              >
                <h3 style={{ margin: '0 0 0.55rem', fontSize: '1.15rem' }}>{f.title}</h3>
                <p style={{ margin: 0, color: 'var(--mp-muted)', lineHeight: 1.55, fontSize: '0.95rem' }}>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mp-section">
        <div className="mp-container">
          <h2 style={{ margin: '0 0 2rem', fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', letterSpacing: '-0.03em' }}>Three steps. Full control.</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
            {steps.map((s) => (
              <li
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                  padding: '1.1rem 0',
                  borderBottom: '1px solid var(--mp-line)',
                }}
              >
                <span style={{ fontWeight: 800, color: '#b7b2ff', fontSize: '0.9rem' }}>{s.n}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.15rem', marginBottom: 4 }}>{s.t}</strong>
                  <span style={{ color: 'var(--mp-muted)', lineHeight: 1.55 }}>{s.d}</span>
                </div>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: '2.5rem' }}>
            <Link href="/studio" className="mp-btn mp-btn-primary">
              Open Meta Pix Studio
            </Link>
          </div>
        </div>
      </section>

      <footer className="mp-container" style={{ padding: '2.5rem 0 3rem', borderTop: '1px solid var(--mp-line)', color: 'var(--mp-muted)', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            © {new Date().getFullYear()} {SITE_NAME} · Mostafij Emon
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/studio">Studio</Link>
            <a href="https://github.com/Mostafijemon24/Meta-Pix" rel="noreferrer" target="_blank">
              GitHub
            </a>
            <a href="https://openrouter.ai" rel="noreferrer" target="_blank">
              OpenRouter
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

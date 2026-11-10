'use client';

import Link from 'next/link';
import { Icon } from '../components/ui';
import type { App } from './state';

export function Home({ app }: { app: App }) {
  const quick = [
    { icon: 'sell', title: 'Add SEO metadata', go: () => app.startImport({ tab: 'meta' }) },
    { icon: 'aspect_ratio', title: 'Resize for social media', go: () => app.startImport({ tab: 'size', platform: 'instagram' }) },
    { icon: 'swap_horiz', title: 'Change format', go: () => app.startImport({ tab: 'format', format: 'webp' }) },
  ];
  return (
    <div className="screen">
      <div className="topbar brand">
        <div className="logo">M</div>
        <span className="h">Meta Pix</span>
        <span style={{ flex: 1 }} />
        <Link href="/" className="link" style={{ height: 40, padding: '0 10px', display: 'flex', alignItems: 'center' }}>
          Site
        </Link>
      </div>
      <div className="scroll" style={{ padding: '16px 20px 24px', gap: 28 }}>
        <div className="hero">
          <h1>Your Images. Perfectly Optimized.</h1>
          <p>
            {app.settings.autoOptimize
              ? 'Drop an image — OpenRouter AI fills SEO metadata, size and format for you.'
              : 'Prepare, optimize, and export images for every social platform.'}
          </p>
          <button className="btn-primary" onClick={() => app.startImport(null)}>
            <Icon name="auto_awesome" size={22} />
            {app.settings.autoOptimize ? 'Auto Optimize Image' : 'Import Image'}
          </button>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="section-title">Quick start</span>
          <div className="card" style={{ borderRadius: 18 }}>
            {quick.map((q) => (
              <button key={q.title} className="row-btn" onClick={q.go}>
                <Icon name={q.icon} size={22} color="var(--pink)" />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{q.title}</span>
                <Icon name="chevron_right" size={20} color="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="section-title">Recent</span>
          {app.recents.length ? (
            <div className="recent-row no-sb">
              {app.recents.map((r) => (
                <button
                  key={r.id}
                  className="thumb"
                  aria-label={`Open ${r.name}`}
                  onClick={() => app.openRecent(r)}
                  style={{ flexShrink: 0, width: 104, height: 104, borderRadius: 16, backgroundImage: `url(${r.thumb})` }}
                />
              ))}
            </div>
          ) : (
            <span className="empty">Images you open will show up here.</span>
          )}
        </div>
      </div>
    </div>
  );
}

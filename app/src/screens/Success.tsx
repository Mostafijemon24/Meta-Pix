import { Icon } from '../components/ui';
import { formatBytes } from '../lib/presets';
import { isNative } from '../lib/save';
import type { App } from '../state';

export function Success({ app }: { app: App }) {
  const last = app.lastExport;
  if (!last) return null;
  return (
    <div className="scroll" style={{ padding: '40px 20px 24px', justifyItems: 'center', gap: 16 }}>
      <span className="success-badge"><Icon name="check" size={32} /></span>
      <span style={{ fontSize: 22, fontWeight: 800 }}>Image exported</span>
      <div style={{ width: 280, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={last.url} alt={last.file} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, display: 'block' }} />
      </div>
      <div className="stack" style={{ alignItems: 'center', gap: 4, textAlign: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, wordBreak: 'break-all' }}>{last.file}</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {last.format} · {last.w} × {last.h} · {formatBytes(last.bytes)}
        </span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Saved to {last.loc}</span>
      </div>
      <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => app.share(last.file, last.blob)}
          style={{ flex: 1, height: 52, border: 'none', borderRadius: 14, background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icon name="share" size={20} />Share
        </button>
        <button
          onClick={() => (isNative ? app.setFullscreen(last.url) : window.open(last.url, '_blank'))}
          style={{ flex: 1, height: 52, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', color: 'var(--ink)', fontSize: 15, fontWeight: 700 }}
        >
          Open
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <button className="link" onClick={() => app.setScreen('editor')}>Back to editor</button>
        <button className="link" onClick={() => app.setScreen('history')}>View history</button>
      </div>
    </div>
  );
}

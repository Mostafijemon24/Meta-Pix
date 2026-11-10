'use client';

import { Icon } from '../components/ui';
import { formatBytes } from '../lib/presets';
import type { App } from './state';

export function History({ app }: { app: App }) {
  return (
    <div className="screen">
      <div className="topbar title"><span className="h">History</span></div>
      <div className="scroll" style={{ padding: '4px 16px 24px', gap: 8 }}>
        {app.history.length === 0 && <span className="empty">Exported images will appear here.</span>}
        {app.history.map((h) => (
          <div key={h.id} className="list-item">
            <span style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 10, background: `var(--surface2) url(${h.thumb}) center / cover` }} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="ellipsis" style={{ fontSize: 14, fontWeight: 700 }}>{h.file}</span>
              <span className="note">{h.format} · {h.w} × {h.h} · {formatBytes(h.bytes)}</span>
            </div>
            <button className="icon-btn" style={{ width: 40, height: 40, color: 'var(--muted)' }} aria-label={`Share ${h.file}`} onClick={() => app.share(h.file, h.blob)}>
              <Icon name="share" size={20} />
            </button>
            <button className="icon-btn" style={{ width: 40, height: 40, color: 'var(--muted)' }} aria-label={`Delete ${h.file} from history`} onClick={() => app.deleteHistory(h.id)}>
              <Icon name="delete" size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

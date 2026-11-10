'use client';

import { Seg, Switch } from '../components/ui';
import { FMT_LABEL, type Format } from '../lib/presets';
import type { App } from './state';

export function Settings({ app }: { app: App }) {
  const s = app.settings;
  return (
    <div className="screen">
      <div className="topbar title">
        <span className="h">Settings</span>
      </div>
      <div className="scroll" style={{ padding: '4px 16px 24px', gap: 18 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Auto Optimize with AI</span>
              <span className="note">On import, OpenRouter fills metadata, size and format</span>
            </span>
            <Switch on={s.autoOptimize} label="Auto Optimize with AI" onToggle={app.toggleAutoOptimize} />
          </div>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="label">Theme</span>
          <Seg
            label="Theme"
            value={s.theme || 'system'}
            onChange={(v) => app.setTheme(v === 'system' ? null : v)}
            options={[
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'System'],
            ]}
          />
        </div>
        <label className="stack" style={{ gap: 8 }}>
          <span className="label">Default creator &amp; copyright name</span>
          <input className="input" value={s.defName} onChange={(e) => app.setDefName(e.target.value)} />
        </label>
        <div className="stack" style={{ gap: 8 }}>
          <span className="label">Default format</span>
          <Seg
            label="Default format"
            value={s.defFormat}
            onChange={app.setDefFormat}
            options={(['jpeg', 'png', 'webp'] as Format[]).map((f) => [f, FMT_LABEL[f]])}
          />
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: '1px solid var(--line)' }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>Remember last save location</span>
            <Switch on={s.remember} label="Remember last save location" onToggle={app.toggleRemember} />
          </div>
          <button
            className="danger"
            onClick={app.clearHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 14,
              border: 'none',
              background: 'none',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'left',
            }}
          >
            Clear export history
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ORIENT_LABEL, type Format, type Orient, type Platform } from '../lib/presets';
import { useBulkStudio, type QueueItem } from './bulkState';
import './web-studio.css';

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="ws-icon" style={{ fontSize: size }} aria-hidden>{name}</span>;
}

function statusLabel(s: QueueItem['status']) {
  if (s === 'queued') return 'Queued';
  if (s === 'optimizing') return 'AI…';
  if (s === 'ready') return 'SEO ready';
  if (s === 'exported') return 'Exported';
  return 'Retry';
}

export default function WebStudio() {
  const app = useBulkStudio();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const sel = app.selected;

  return (
    <div className="ws" data-theme={app.theme}>
      <header className="ws-top">
        <Link href="/" className="ws-brand">
          <span className="ws-logo">M</span>
          Meta Pix Studio
        </Link>
        <div className="ws-stats" style={{ marginLeft: 8 }}>
          <span>
            <b>{app.stats.total}</b> images
          </span>
          <span>
            <b>{app.stats.ready}</b> SEO ready
          </span>
          {app.stats.optimizing > 0 && (
            <span>
              <b>{app.stats.optimizing}</b> running
            </span>
          )}
          {app.stats.errors > 0 && (
            <span>
              <b>{app.stats.errors}</b> errors
            </span>
          )}
        </div>
        <div className="ws-actions">
          <button className="ws-btn" type="button" onClick={() => input.current?.click()}>
            <Icon name="upload" /> Add images
          </button>
          <button className="ws-btn soft" type="button" disabled={!app.items.length || app.busy} onClick={app.optimizeAll}>
            <Icon name="auto_awesome" /> Optimize all
          </button>
          {app.busy && (
            <button className="ws-btn danger" type="button" onClick={app.stop}>
              Stop
            </button>
          )}
          <button className="ws-btn primary" type="button" disabled={!app.items.length || app.busy} onClick={app.exportAll}>
            <Icon name="download" /> Export all ZIP
          </button>
        </div>
      </header>

      <div className="ws-layout">
        <aside className="ws-queue">
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) app.addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className={'ws-drop' + (over ? ' over' : '')}
            onClick={() => input.current?.click()}
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer.files?.length) app.addFiles(e.dataTransfer.files);
            }}
          >
            <Icon name="add_photo_alternate" size={28} />
            <strong>Drop images or browse</strong>
            <span>Bulk SEO metadata · new filenames · WebP/JPEG/PNG</span>
          </button>

          <div className="ws-list">
            {app.items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4 }}>
                <button
                  type="button"
                  className="ws-card"
                  aria-current={item.id === app.selectedId ? 'true' : undefined}
                  onClick={() => app.setSelectedId(item.id)}
                >
                  <img src={item.thumb} alt="" />
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{item.fields.fileName || item.originalName}</div>
                    <div className="s">
                      {item.src.w}×{item.src.h} · was {item.originalName}
                    </div>
                  </div>
                  <span className={'ws-badge ' + item.status}>{statusLabel(item.status)}</span>
                </button>
                <button
                  type="button"
                  className="ws-btn"
                  style={{ width: 36, padding: 0, height: 36, alignSelf: 'center' }}
                  aria-label="Remove"
                  onClick={() => app.removeItem(item.id)}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            ))}
            {!app.items.length && <p className="ws-empty">No images yet. Drop a batch to start.</p>}
          </div>
          {app.items.length > 0 && (
            <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
              <button type="button" className="ws-btn danger" style={{ flex: 1 }} onClick={app.clearAll}>
                Clear queue
              </button>
            </div>
          )}
        </aside>

        <section className="ws-main">
          {sel ? (
            <>
              <div className="ws-preview">
                <img src={sel.src.url} alt={sel.fields.alt || sel.originalName} />
              </div>
              <div className="ws-stats">
                <span>
                  Output <b>{app.selectedOut[0]}×{app.selectedOut[1]}</b>
                </span>
                <span>
                  Format <b>{app.fmtLabel[sel.format]}</b>
                </span>
                <span>
                  SEO file <b className="ws-filename">{sel.fields.fileName || '…'}{sel.format === 'jpeg' ? '.jpg' : `.${sel.format}`}</b>
                </span>
              </div>
              {sel.reason && <p className="ws-note">AI: {sel.reason}</p>}
              {sel.error && <p className="ws-note" style={{ color: 'var(--danger)' }}>{sel.error}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="ws-btn soft" disabled={app.busy} onClick={app.optimizeSelected}>
                  <Icon name="auto_awesome" /> Re-optimize this image
                </button>
                <button type="button" className="ws-btn primary" disabled={app.busy} onClick={app.exportSelected}>
                  <Icon name="download" /> Export this file
                </button>
              </div>
            </>
          ) : (
            <div className="ws-preview">
              <div className="ws-empty">
                <strong style={{ display: 'block', color: 'var(--ink)', fontSize: 18, marginBottom: 8 }}>
                  Bulk SEO image studio
                </strong>
                Add multiple images. OpenRouter fills title, alt, keywords and a <em>new</em> SEO filename for each — then export as ZIP.
              </div>
            </div>
          )}
        </section>

        <aside className="ws-meta">
          <h2>SEO metadata</h2>
          {!sel ? (
            <p className="ws-note">Select an image to edit fields.</p>
          ) : (
            <>
              <label>
                <span className="ws-label">New SEO file name (no extension)</span>
                <input
                  className="ws-input ws-filename"
                  value={sel.fields.fileName}
                  placeholder="descriptive-kebab-slug"
                  onChange={(e) => app.setField('fileName', e.target.value)}
                />
              </label>
              {app.fieldsList
                .filter(([k]) => k !== 'fileName')
                .map(([k, label]) => (
                  <label key={k}>
                    <span className="ws-label">{label}</span>
                    {k === 'description' || k === 'alt' || k === 'caption' ? (
                      <textarea
                        className="ws-textarea"
                        value={sel.fields[k]}
                        onChange={(e) => app.setField(k, e.target.value)}
                      />
                    ) : (
                      <input className="ws-input" value={sel.fields[k]} onChange={(e) => app.setField(k, e.target.value)} />
                    )}
                  </label>
                ))}

              <div className="ws-row">
                <label>
                  <span className="ws-label">Platform</span>
                  <select
                    className="ws-select"
                    value={sel.platform}
                    onChange={(e) => app.setSelectedPatch({ platform: e.target.value as Platform })}
                  >
                    <option value="original">Original size</option>
                    {Object.entries(app.presets).map(([k, p]) => (
                      <option key={k} value={k}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ws-label">Orientation</span>
                  <select
                    className="ws-select"
                    value={sel.orient}
                    onChange={(e) => app.setSelectedPatch({ orient: e.target.value as Orient })}
                    disabled={sel.platform === 'original' || sel.platform === 'custom'}
                  >
                    {(Object.keys(ORIENT_LABEL) as Orient[]).map((o) => (
                      <option key={o} value={o}>
                        {ORIENT_LABEL[o]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="ws-row">
                <label>
                  <span className="ws-label">Format</span>
                  <select
                    className="ws-select"
                    value={sel.format}
                    onChange={(e) => app.setSelectedPatch({ format: e.target.value as Format })}
                  >
                    <option value="webp">WebP</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                  </select>
                </label>
                <label>
                  <span className="ws-label">Quality</span>
                  <input
                    className="ws-input"
                    type="number"
                    min={10}
                    max={100}
                    value={sel.quality}
                    onChange={(e) => app.setSelectedPatch({ quality: Math.min(100, Math.max(10, +e.target.value || 88)) })}
                  />
                </label>
              </div>

              <div className="ws-switch">
                <span>Copyright · {sel.creator || '—'}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sel.crOn}
                  onClick={() => app.setSelectedPatch({ crOn: !sel.crOn })}
                >
                  <span />
                </button>
              </div>
              <label>
                <span className="ws-label">Creator name</span>
                <input
                  className="ws-input"
                  value={sel.creator}
                  onChange={(e) => app.setSelectedPatch({ creator: e.target.value })}
                />
              </label>
            </>
          )}

          <h2 style={{ marginTop: 8 }}>Studio settings</h2>
          <div className="ws-switch">
            <span>Auto-optimize on upload</span>
            <button
              type="button"
              role="switch"
              aria-checked={app.settings.autoOptimize}
              onClick={() => app.setSettings((s) => ({ ...s, autoOptimize: !s.autoOptimize }))}
            >
              <span />
            </button>
          </div>
          <label>
            <span className="ws-label">Parallel AI jobs (faster bulk)</span>
            <select
              className="ws-select"
              value={app.settings.concurrency}
              onChange={(e) => app.setSettings((s) => ({ ...s, concurrency: Math.min(5, Math.max(1, +e.target.value || 3)) }))}
            >
              <option value={1}>1 (safest)</option>
              <option value={2}>2</option>
              <option value={3}>3 (default)</option>
              <option value={4}>4</option>
              <option value={5}>5 (max speed)</option>
            </select>
          </label>
          <label>
            <span className="ws-label">Theme</span>
            <select
              className="ws-select"
              value={app.settings.theme || 'system'}
              onChange={(e) =>
                app.setSettings((s) => ({
                  ...s,
                  theme: e.target.value === 'system' ? null : (e.target.value as 'light' | 'dark'),
                }))
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </aside>
      </div>

      {app.toastMsg && (
        <div className="ws-toast" role="status" aria-live="polite">
          {app.toastMsg}
        </div>
      )}
    </div>
  );
}

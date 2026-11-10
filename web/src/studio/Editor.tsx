'use client';

import { CORE_FIELDS, EXT, EXTRA_FIELDS, FMT_LABEL, ORIENT_LABEL, PRESETS, fitBox, formatBytes, placeImage, type Format, type Orient, type PlatformKey } from '../lib/presets';
import { Icon, Seg, Switch } from '../components/ui';
import type { App } from './state';

/** Output frame with the source image placed inside it (crop or fit). */
export function FramePreview({ url, src, out, mode, format, box }: {
  url: string; src: [number, number]; out: [number, number]; mode: 'fill' | 'fit'; format: Format; box: [number, number];
}) {
  const [fw, fh] = fitBox(box[0], box[1], out[0] / out[1]);
  const r = placeImage(fw, fh, src[0], src[1], mode);
  const px = (n: number) => Math.round(n) + 'px';
  // Fit pads with white for JPEG, transparency (checkerboard) for PNG/WebP.
  const transparent = mode === 'fit' && format !== 'jpeg';
  return (
    <div
      className={'frame' + (transparent ? ' checker' : '')}
      style={{ width: px(fw), height: px(fh), borderRadius: 6, background: transparent ? undefined : '#FFFFFF' }}
    >
      <img src={url} alt="" style={{ left: px(r.x), top: px(r.y), width: px(r.w), height: px(r.h) }} />
    </div>
  );
}

export function Editor({ app }: { app: App }) {
  const { edit: e, src } = app;
  if (!src) return null;
  const fields = [...CORE_FIELDS, ...(e.more ? EXTRA_FIELDS : [])];
  const preset = e.platform in PRESETS ? PRESETS[e.platform as PlatformKey] : null;

  return (
    <div className="screen">
      <div className="topbar" style={{ height: 56 }}>
        <button className="icon-btn" onClick={() => app.setScreen('home')} aria-label="Back">
          <Icon name="arrow_back" />
        </button>
        <span className="h" style={{ flex: 1, fontSize: 16 }}>Edit image</span>
        <button className="link" style={{ height: 40, padding: '0 12px', borderRadius: 20 }} onClick={() => app.startImport(null)}>
          Replace
        </button>
      </div>

      <div ref={app.scrollRef} className="no-sb" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {/* Image preview — always at the very top */}
        <div style={{ padding: '4px 16px 0' }}>
          <div className="preview" style={{ aspectRatio: String(Math.max(src.w / src.h, 1)) }}>
            <img src={src.url} alt={e.fields.alt || src.name} />
            <button className="fab-mini" onClick={() => app.setFullscreen(src.url)} aria-label="Full screen preview">
              <Icon name="open_in_full" size={20} />
            </button>
          </div>
          <span className="ellipsis" style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            {src.name} · {src.w} × {src.h} · {formatBytes(src.bytes)}
          </span>
        </div>

        <div data-anchor="tabs" style={{ height: 10 }} />
        <div className="tabs-wrap">
          <Seg
            className="tabs"
            label="Editing sections"
            value={e.tab}
            onChange={app.setTab}
            options={[['meta', 'Metadata'], ['size', 'Size'], ['format', 'Format']]}
          />
        </div>

        {e.tab === 'meta' && (
          <div className="panel" style={{ gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-soft" style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 14 }} onClick={app.generate} disabled={app.generating}>
                <Icon name="auto_awesome" size={20} />
                {app.generating ? 'AI optimizing…' : 'Auto Optimize with AI'}
              </button>
              <button
                onClick={app.copyAll}
                title="Copy all"
                aria-label="Copy all metadata"
                style={{ width: 46, height: 46, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="content_copy" size={20} />
              </button>
            </div>
            {app.aiReason && (
              <span className="note" style={{ lineHeight: 1.45 }}>
                AI: {app.aiReason}
              </span>
            )}

            {fields.map(([k, l, ph]) => (
              <label key={k} className="stack" style={{ gap: 6 }}>
                <span className="label">{l}</span>
                <div className="field-wrap">
                  <input
                    className="input"
                    value={e.fields[k]}
                    placeholder={app.generating ? 'Generating…' : ph}
                    onChange={(ev) => app.setField(k, ev.target.value)}
                  />
                  {e.fields[k] && (
                    <button className="clear-btn" aria-label={`Clear ${l}`} onClick={(ev) => (ev.preventDefault(), app.setField(k, ''))}>
                      <Icon name="close" size={18} />
                    </button>
                  )}
                </div>
              </label>
            ))}
            <button className="link" style={{ display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }} onClick={() => app.setEdit({ more: !e.more })}>
              {e.more ? 'Fewer fields' : `More fields (${EXTRA_FIELDS.length})`}
              <Icon name={e.more ? 'expand_less' : 'expand_more'} size={20} />
            </button>

            <div className="card" style={{ overflow: 'visible' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <button
                  onClick={() => app.setEdit({ crOpen: !e.crOpen })}
                  aria-expanded={e.crOpen && e.crOn}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, border: 'none', background: 'none', padding: 0, color: 'var(--ink)', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800 }}>Copyright</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{e.crOn ? e.cr.creator || 'No name' : 'Not added'}</span>
                </button>
                <Switch on={e.crOn} label="Include copyright" onToggle={() => app.setEdit({ crOn: !e.crOn })} />
              </div>
              {e.crOpen && e.crOn && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {([['creator', 'Creator'], ['owner', 'Copyright owner'], ['notice', 'Copyright notice']] as const).map(([k, l]) => (
                    <label key={k} className="stack" style={{ gap: 4 }}>
                      <span className="label" style={{ fontSize: 12 }}>{l}</span>
                      <input
                        className="input"
                        style={{ height: 44, padding: '0 12px', borderRadius: 10, background: 'var(--bg)' }}
                        value={e.cr[k]}
                        placeholder="Optional"
                        onChange={(ev) => app.setEdit({ cr: { ...e.cr, [k]: ev.target.value } })}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Existing image metadata</span>
              <Seg
                label="Existing image metadata"
                value={e.metaMode}
                onChange={(v) => app.setEdit({ metaMode: v })}
                options={[['keep', 'Keep'], ['update', 'Update'], ['remove', 'Remove all']]}
              />
              <span className="note">
                {e.metaMode === 'remove'
                  ? 'All EXIF / IPTC / XMP data will be stripped.'
                  : e.metaMode === 'update'
                    ? 'Only fields you edit are overwritten.'
                    : 'Existing data is kept; new fields are added.'}
              </span>
            </div>
          </div>
        )}

        {e.tab === 'size' && (
          <div className="panel" style={{ gap: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="Platform">
              {([['original', 'Original'], ...Object.entries(PRESETS).map(([k, p]) => [k, p.name]), ['custom', 'Custom']] as [string, string][]).map(([k, n]) => (
                <button key={k} className="chip" aria-pressed={e.platform === k} onClick={() => app.choosePlatform(k as PlatformKey | 'original' | 'custom')}>
                  {n}
                </button>
              ))}
            </div>

            {preset && (
              <div className="card" role="radiogroup" aria-label="Orientation">
                {(Object.entries(preset.sizes) as [Orient, [number, number]][]).map(([k, [w, h]]) => (
                  <button key={k} className="radio-row" role="radio" aria-checked={e.orient === k} onClick={() => app.setEdit({ orient: k })}>
                    <span className="radio" />
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{ORIENT_LABEL[k]}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{w} × {h}</span>
                  </button>
                ))}
              </div>
            )}

            {e.platform === 'custom' && (
              <div className="stack" style={{ gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <label className="stack" style={{ flex: 1, gap: 4 }}>
                    <span className="label" style={{ fontSize: 12 }}>Width</span>
                    <input className="input num" type="number" inputMode="numeric" min={1} value={e.customW} onChange={(ev) => app.onCustomW(ev.target.value)} />
                  </label>
                  <button
                    onClick={app.toggleLock}
                    title="Lock ratio"
                    aria-label="Lock aspect ratio"
                    aria-pressed={e.lock}
                    style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 12, border: '1px solid var(--line)', background: e.lock ? 'var(--soft)' : 'var(--surface)', color: e.lock ? 'var(--pink)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name={e.lock ? 'lock' : 'lock_open'} size={20} />
                  </button>
                  <label className="stack" style={{ flex: 1, gap: 4 }}>
                    <span className="label" style={{ fontSize: 12 }}>Height</span>
                    <input className="input num" type="number" inputMode="numeric" min={1} value={e.customH} onChange={(ev) => app.onCustomH(ev.target.value)} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {app.settings.customPresets.map((p) => (
                    <span key={p.id} className="pill">
                      <button style={{ padding: '0 4px 0 12px', color: 'var(--ink)', fontSize: 12, fontWeight: 700 }} onClick={() => app.setEdit({ customW: p.w, customH: p.h, ratio: p.w / p.h })}>
                        {p.w} × {p.h}
                      </button>
                      <button aria-label={`Delete preset ${p.w} × ${p.h}`} style={{ width: 30, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => app.deletePreset(p.id)}>
                        <Icon name="close" size={16} />
                      </button>
                    </span>
                  ))}
                  <button className="btn-soft" style={{ height: 36, padding: '0 12px', borderRadius: 18, fontSize: 12 }} onClick={app.savePreset}>
                    + Save preset
                  </button>
                </div>
              </div>
            )}

            {e.platform !== 'original' ? (
              <div className="stack" style={{ gap: 12 }}>
                <div className="resize-stage">
                  <FramePreview url={src.url} src={[src.w, src.h]} out={app.out} mode={e.resize} format={e.format} box={[240, 150]} />
                </div>
                <Seg
                  label="Resize mode"
                  value={e.resize}
                  onChange={(v) => app.setEdit({ resize: v })}
                  options={[['fill', 'Crop to fill'], ['fit', 'Fit (add border)']]}
                />
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                Keeping the original {src.w} × {src.h} size. Pick a platform to resize.
              </span>
            )}
          </div>
        )}

        {e.tab === 'format' && (
          <div className="panel" style={{ gap: 18 }}>
            <Seg
              className="lg"
              label="Format"
              value={e.format}
              onChange={(v) => app.setEdit({ format: v })}
              options={(['jpeg', 'png', 'webp'] as Format[]).map((f) => [f, FMT_LABEL[f]])}
            />
            {e.format !== 'png' ? (
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Quality</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pink)' }}>{e.quality}%</span>
                </div>
                <input className="range" type="range" min={10} max={100} value={e.quality} aria-label="Quality" onChange={(ev) => app.setEdit({ quality: +ev.target.value })} />
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>PNG is lossless and keeps transparency.</span>
            )}
            <label className="stack" style={{ gap: 6 }}>
              <span className="label">File name</span>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', overflow: 'hidden' }}>
                <input
                  value={e.fields.fileName}
                  placeholder={src.name.replace(/\.[^.]+$/, '')}
                  onChange={(ev) => app.setField('fileName', ev.target.value)}
                  style={{ flex: 1, minWidth: 0, height: '100%', padding: '0 4px 0 14px', border: 'none', background: 'transparent', color: 'var(--ink)', fontSize: 15, outline: 'none' }}
                />
                <span style={{ padding: '0 14px', fontSize: 14, color: 'var(--muted)' }}>{EXT[e.format]}</span>
              </div>
            </label>
            <button
              onClick={() => app.setSheet('location')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', textAlign: 'left' }}
            >
              <Icon name="folder" size={22} color="var(--pink)" />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span className="note">Save to</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{app.locLabel}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>Change</span>
            </button>
          </div>
        )}
      </div>

      {/* Fixed export bar — visible on every section */}
      <div className="export-bar">
        <span className="note" style={{ textAlign: 'center' }}>
          {FMT_LABEL[e.format]} · {app.out[0]} × {app.out[1]} · ~{app.estimate} · {app.metaStatus}
        </span>
        <button className="btn-primary" onClick={app.doExport} disabled={app.exporting}>
          {app.exporting ? 'Exporting…' : 'Export Image'}
          <Icon name="arrow_forward" size={20} />
        </button>
      </div>
    </div>
  );
}

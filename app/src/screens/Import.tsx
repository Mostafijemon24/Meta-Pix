import { useRef, useState } from 'react';
import { Icon, TopBar } from '../components/ui';
import type { App } from '../state';

export function Import({ app }: { app: App }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (f?: File | null) => f && app.openImage(f, f.name);
  return (
    <div className="screen">
      <TopBar onBack={() => app.setScreen('home')} title="Choose an image" />
      <div className="scroll" style={{ padding: '8px 16px 24px', gap: 16 }}>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => (take(e.target.files?.[0]), (e.target.value = ''))}
        />
        <button
          className={'drop' + (over ? ' over' : '')}
          onClick={() => input.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => (e.preventDefault(), setOver(false), take(e.dataTransfer.files[0]))}
        >
          <Icon name="upload" size={30} color="var(--pink)" />
          <span style={{ fontSize: 15, fontWeight: 800 }}>Browse files</span>
          <span className="note">Original is never modified</span>
        </button>
        {app.recents.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Recent</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {app.recents.map((r) => (
                <button
                  key={r.id}
                  className="thumb"
                  aria-label={`Open ${r.name}`}
                  onClick={() => app.openRecent(r)}
                  style={{ aspectRatio: '1', borderRadius: 12, backgroundImage: `url(${r.thumb})` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

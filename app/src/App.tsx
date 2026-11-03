import { useEffect, useRef } from 'react';
import { Icon } from './components/ui';
import { canPickFolder, isNative, NATIVE_FOLDER } from './lib/save';
import { Editor } from './screens/Editor';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Import } from './screens/Import';
import { Settings } from './screens/Settings';
import { Success } from './screens/Success';
import { useMetaPix, type App as AppT } from './state';

function LocationSheet({ app }: { app: AppT }) {
  const s = app.settings;
  const rows = [
    { key: 'dl', label: isNative ? NATIVE_FOLDER : 'Downloads', on: s.location === 'downloads', go: app.chooseDownloads },
    ...(app.folder ? [{ key: 'f', label: app.folder.name, on: s.location === 'folder', go: app.chooseSavedFolder }] : []),
    ...(canPickFolder ? [{ key: 'new', label: 'Choose folder…', on: false, go: app.chooseNewFolder }] : []),
  ];
  return (
    <div className="sheet-wrap">
      <button className="scrim" aria-label="Close" onClick={() => app.setSheet(null)} />
      <div className="sheet" role="dialog" aria-label="Save location">
        <span className="grabber" />
        {rows.map((r) => (
          <button key={r.key} className="sheet-row" role="radio" aria-checked={r.on} onClick={r.go}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{r.label}</span>
            {r.on && <Icon name="check" size={20} color="var(--primary)" />}
          </button>
        ))}
        {!canPickFolder && (
          <span className="note" style={{ padding: '4px 12px' }}>
            {isNative ? 'Exports are saved to Documents / MetaPix on this phone.' : 'This browser saves exports to your Downloads folder.'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const app = useMetaPix();
  const { screen, sheet, fullscreen } = app;

  // Android back button: close overlays first, then step back to Home.
  const stateRef = useRef({ screen, sheet, fullscreen });
  stateRef.current = { screen, sheet, fullscreen };
  useEffect(() => {
    if (screen !== 'home' || sheet || fullscreen) history.pushState({ mp: 1 }, '');
  }, [screen, sheet, fullscreen]);
  useEffect(() => {
    const onPop = () => {
      const s = stateRef.current;
      if (s.fullscreen) app.setFullscreen(null);
      else if (s.sheet) app.setSheet(null);
      else if (s.screen === 'success') app.setScreen('editor');
      else if (s.screen !== 'home') app.setScreen('home');
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNav = screen === 'home' || screen === 'history' || screen === 'settings';
  const nav = [['home', 'Home', 'home'], ['history', 'History', 'history'], ['settings', 'Settings', 'settings']] as const;

  return (
    <div className="app" data-theme={app.theme}>
      {screen === 'home' && <Home app={app} />}
      {screen === 'import' && <Import app={app} />}
      {screen === 'editor' && <Editor app={app} />}
      {screen === 'success' && <Success app={app} />}
      {screen === 'history' && <History app={app} />}
      {screen === 'settings' && <Settings app={app} />}

      {showNav && (
        <nav className="nav">
          {nav.map(([k, l, ic]) => (
            <button key={k} aria-current={screen === k ? 'page' : undefined} onClick={() => app.setScreen(k)}>
              <Icon name={ic} fill={screen === k} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{l}</span>
            </button>
          ))}
        </nav>
      )}

      {sheet === 'location' && <LocationSheet app={app} />}

      {fullscreen && (
        <button className="fullscreen" aria-label="Close full screen preview" onClick={() => app.setFullscreen(null)}>
          <img src={fullscreen} alt="" />
        </button>
      )}

      {app.toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          <span>{app.toastMsg}</span>
        </div>
      )}
    </div>
  );
}

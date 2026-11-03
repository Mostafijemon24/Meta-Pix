import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

import { isNative } from './lib/save';

// The APK ships its files inside the app, so it needs no service worker.
if (!isNative) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

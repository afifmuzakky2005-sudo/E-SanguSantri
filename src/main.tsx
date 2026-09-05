import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker immediately for standalone WebAPK PWA support
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('E-SanguSantri PWA ready for offline & standalone WebAPK execution');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

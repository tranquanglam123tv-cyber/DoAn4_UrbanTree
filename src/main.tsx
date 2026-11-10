import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 📱 Đăng ký PWA Service Worker hỗ trợ Offline & Add-to-Home-Screen
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('🌿 [UrbanTree PWA] Service Worker sẵn sàng:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [UrbanTree PWA] Service Worker failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

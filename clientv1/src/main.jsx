import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';

// ✅ Register Service Worker (IMPORTANT)
if ('serviceWorker' in navigator) {
  const swUrl = '/portal/firebase-messaging-sw.js'; // 👈 because base = /portal

  navigator.serviceWorker.register(swUrl)
    .then((reg) => {
      console.log('✅ Service Worker registered:', reg);
    })
    .catch((err) => {
      console.error('❌ Service Worker error:', err);
    });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Analytics } from '@vercel/analytics/react';
import { initAllAnimations } from './animations.js';
import { initPostHog } from './services/posthog';

// Initialize PostHog analytics
initPostHog();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    {/* Only load Vercel Analytics in production to prevent dev console errors */}
    {import.meta.env.PROD && <Analytics />}
  </React.StrictMode>
);

// Initialize modern CSS animations and micro-interactions
initAllAnimations();

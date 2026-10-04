import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

/**
 * HashRouter, not BrowserRouter.
 *
 * This is a static bundle with no server-side rewrite rule, so a path-based
 * router 404s on every deep link and refresh. Hash routing keeps the app fully
 * navigable on any plain static host with no platform configuration.
 */
createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
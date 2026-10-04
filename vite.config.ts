import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * Mounts the same /api/ai handler the production server uses, so `npm run dev`
 * talks to real Gemma without running a second process. The key is read from
 * the environment on the server side and never reaches the browser.
 */
function apiRoutes(): Plugin {
  return {
    name: 'butcher-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const { createRequestHandler } = await server.ssrLoadModule('/server/entry.ts');
        createRequestHandler(process.cwd())(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiRoutes()],
  // Deliberately narrow. Only BP_PUBLIC_* is readable by client code, so
  // GEMINI_API_KEY can never be pulled into the browser bundle by accident.
  envPrefix: 'BP_PUBLIC_',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
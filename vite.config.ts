import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import pluginRewriteAll from 'vite-plugin-rewrite-all';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawApi = env.VITE_API_URL || 'http://localhost:3000/api'
  const apiOrigin = rawApi.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'http://localhost:3000'

  return {
    plugins: [react(), pluginRewriteAll()],
    assetsInclude: ['**/*.glb'],
    /**
     * Omit the `development` export condition so Lit / @lit/reactive-element resolve to
     * production bundles — removes "Lit is in dev mode" spam from @google/model-viewer in `vite dev`.
     */
    resolve: {
      dedupe: ['react', 'react-dom'],
      conditions: ['import', 'module', 'browser', 'default'],
      /**
       * `prop-types` main entry uses dev-only `require('react-is'|'object-assign')` → breaks in Vite ESM
       * and under SES (e.g. wallet lockdown). The official min bundle is self-contained.
       */
      alias: {
        'prop-types': path.resolve(__dirname, 'node_modules/prop-types/prop-types.min.js'),
      },
    },
    optimizeDeps: {
      include: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
      esbuildOptions: {
        // Keep Lit on production entry when pre-bundling model-viewer for the dev server.
        conditions: ['import', 'module', 'browser', 'default'],
      },
    },
    server: {
      proxy: {
        // Same-origin `/api` in dev (see `getApiBase()`); avoids CORS and matches production path shape.
        '/api': { target: apiOrigin, changeOrigin: true },
        '/inventory-files': { target: apiOrigin, changeOrigin: true },
        '/uploads': { target: apiOrigin, changeOrigin: true },
      },
    },
  }
})

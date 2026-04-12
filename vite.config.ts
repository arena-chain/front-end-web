import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import pluginRewriteAll from 'vite-plugin-rewrite-all';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawApi = env.VITE_API_URL || 'http://localhost:3000/api'
  const apiOrigin = rawApi.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'http://localhost:3000'

  return {
    plugins: [react(), pluginRewriteAll()],
    assetsInclude: ['**/*.glb'],
    server: {
      proxy: {
        // Same-origin in dev so <model-viewer> can load GLBs (avoids cross-origin fetch issues)
        '/inventory-files': { target: apiOrigin, changeOrigin: true },
        '/uploads': { target: apiOrigin, changeOrigin: true },
      },
    },
  }
})

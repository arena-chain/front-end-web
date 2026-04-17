import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import pluginRewriteAll from 'vite-plugin-rewrite-all';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pluginRewriteAll()],
  assetsInclude: ['**/*.glb'],
})

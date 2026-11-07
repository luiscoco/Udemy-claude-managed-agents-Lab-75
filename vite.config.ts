import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Only the app and the explicit framework harness are browser entry points.
  // Do not crawl downloaded workbooks, generated HTML or runtime worktrees.
  optimizeDeps: {
    entries: ['index.html', 'browser-tests/harness.html'],
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'zod'],
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    // Other learning apps may occupy 5174. Vite reports the next available port.
    strictPort: false,
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.LEARNING_API_PORT ?? 3076}`, changeOrigin: false, ws: true } },
    // Generated course media and render caches are served on demand. Watching
    // them makes startup crawl the output trees and reloads the app on exports.
    watch: mode === 'browser-test' ? null : { ignored: ['**/videos/**', '**/presentations/**', '**/artifacts/**', '**/.venv/**', '**/__pycache__/**', '**/*-lab/**', '**/sandbox/**', '**/generated/**', '**/logs/**', '**/sessions/**'] },
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.claude/**', '**/sessions/**', '**/*-lab/**', '**/sandbox/**', '**/workspaces/**', '**/server/acceptance/**'] },
  },
}));

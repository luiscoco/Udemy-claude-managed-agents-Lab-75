import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    // Other learning apps may occupy 5174. Vite reports the next available port.
    strictPort: false,
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.LEARNING_API_PORT ?? 3076}`, changeOrigin: false, ws: true } },
    watch: { ignored: ['**/*-lab/**', '**/sandbox/**', '**/generated/**', '**/logs/**', '**/sessions/**'] },
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.claude/**', '**/sessions/**', '**/*-lab/**', '**/sandbox/**', '**/workspaces/**', '**/server/acceptance/**'] },
  },
});

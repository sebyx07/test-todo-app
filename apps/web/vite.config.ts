import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    // Fixed port, loud failure: an agent must never guess which port the app landed on.
    port: 5180,
    strictPort: true,
    // /api/* → the Hono API on :3000, so the browser never deals with CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: { target: 'esnext' },
});

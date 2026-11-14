import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento, /api vai para o `wrangler dev` (porta 8787): sem CORS.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});

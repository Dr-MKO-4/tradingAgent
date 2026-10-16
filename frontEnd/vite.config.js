// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Inline PostCSS config: stops Vite from picking up the repository root
  // postcss.config.js (Tailwind), which this front-end does not use.
  css: { postcss: { plugins: [] } },
  test: { environment: 'node', include: ['src/**/*.test.js'], testTimeout: 60000 },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      // cf. point 4, pour fiabiliser HMR en OneDrive
      usePolling: true
    }
  },
});

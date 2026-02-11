/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const analyze = !!(globalThis as any).process?.env?.ANALYZE;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(analyze ? [visualizer({
    filename: 'dist/stats.html',
    template: 'treemap',
    gzipSize: true,
    brotliSize: true,
    open: true
  })] : [])],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          reactflow: ['reactflow'],
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5112',
        changeOrigin: true
      }
    }
  }
});

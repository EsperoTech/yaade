import react from '@vitejs/plugin-react';
import { Buffer } from 'buffer';
import Stream from 'stream-browserify';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // node polyfills are required for httpsnippet
    nodePolyfills({
      include: ['process'],
    }),
  ],
  server: {
    port: 9338,
    proxy: {
      '/api': {
        target: 'http://localhost:9339',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/ws': {
        target: 'ws://localhost:9339',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // Alias httpsnippet polyfills
      buffer: 'buffer',
      stream: 'stream-browserify',
      querystring: 'qs',
    },
  },
});

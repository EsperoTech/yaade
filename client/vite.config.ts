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
